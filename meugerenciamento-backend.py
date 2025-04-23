import time
import smtplib
import mysql.connector
import ldap3
import os
import logging
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import timedelta
import schedule


import locale
locale.setlocale(locale.LC_TIME, 'pt_BR')  # Tente sem o '.UTF-8'


# Configuração de logs
logging.basicConfig(
    filename="agent_service.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

# Configurações do banco de dados
db_config = {
    "host": "localhost",
    "port": 3306,
    "user": "user",
    "password": "senha",
    "database": "banco",
    "auth_plugin": "mysql_native_password"
}

# Configurações LDAP
ldap_server = "ldap://seuserver.com"
ldap_base_dn = "DC=seuserver,DC=com"

def connect_db():
    return mysql.connector.connect(**db_config)

def get_email_from_ldap(username):
    try:
        server = ldap3.Server(ldap_server)
        conn = ldap3.Connection(server, user="SEUAD\\ryan.oliveira", password="SENHA", auto_bind=True) # Autenticação no AD
        search_filter = f"(sAMAccountName={username})"
        conn.search(ldap_base_dn, search_filter, attributes=['mail'])
        
        if conn.entries:
            email = conn.entries[0].mail.value
            logging.info(f"Email encontrado para {username}: {email}")
            return email
        else:
            logging.warning(f"Nenhum email encontrado no LDAP para {username}")
    except Exception as e:
        logging.error(f"Erro ao buscar e-mail no LDAP para {username}: {e}")
    return None


def reset_old_entries():
    conn = connect_db()
    cursor = conn.cursor(dictionary=True)  # Garante que a consulta retorna os dados como dicionário
    current_month = datetime.now().strftime("%Y-%m")
    mes_atual = datetime.now().strftime("%B - %Y").capitalize() 
    current_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")  # Data atual para last_reset

    # Primeiro, consulta as medições que serão alteradas (status1 = 'NF Enviada')
    query_reset = (
        "SELECT id, user, nome FROM mediacoes WHERE status1 = 'NF Enviada' "
        "AND DATE_FORMAT(last_reset, '%Y-%m') != %s AND (deleted IS NULL OR deleted = '')"
    )
    cursor.execute(query_reset, (current_month,))
    
    # Obter as medições que serão resetadas
    rows_reset = cursor.fetchall()

    if rows_reset:
        # Vamos agrupar as medições por usuário para enviar o e-mail correto
        user_mediations = {}

        for row in rows_reset:
            user = row["user"]
            if user not in user_mediations:
                user_mediations[user] = []
            user_mediations[user].append(row)

        # Agora, enviamos um e-mail para cada usuário responsável
        for user, mediations in user_mediations.items():
            email = get_email_from_ldap(user)
            if email:
                subject = f"Alerta Meu Gerenciamento: Medições Resetadas para Pendente - {mes_atual}"
                body = f"""
                <html>
                    <body>
                        <p>As seguintes medições foram resetadas para o status <span style="color:red;">'Pendente'</span> para que sejam realizadas no mês de {mes_atual}:</p>
                        <ul>
                """
                for mediation in mediations:
                    body += f"<li>Medição: <strong>{mediation['nome']}</strong><i>(ID:{mediation['id']})</i></li>"
                
                body += """
                        </ul>
                        <br>
                        <p><small><i>Mensagem automática enviada pelo sistema Meu Gerenciamento. Powered by Ryan Ribeiro - 2025.</i></small></p>
                    </body>
                </html>
                """
                # Envia o e-mail para o usuário responsável
                send_email(email, subject, body)
                logging.info(f"E-mail enviado para {email} sobre as medições resetadas.")
            else:
                logging.warning(f"Nenhum e-mail encontrado para o usuário {user}.")
        
        # Agora, vamos fazer o update das medições, alterando o status para 'Pendente'
        query_update = (
            "UPDATE mediacoes SET status1='Pendente', pedenv1=NULL, pedenv2=NULL, pedenv3=NULL, pedenv4=NULL, last_reset=%s "
            "WHERE status1 = 'NF Enviada' AND DATE_FORMAT(last_reset, '%Y-%m') != %s AND (deleted IS NULL OR deleted = '')"
        )
        cursor.execute(query_update, (current_date, current_month))
        conn.commit()

        logging.info(f"{cursor.rowcount} medições atualizadas para 'Pendente'.")
    else:
        logging.info("Nenhuma medição foi resetada no mês atual.")
    
    cursor.close()
    conn.close()

    
def send_email(to_email, subject, body):
    from_email = "Meu Gerenciamento <seuemail@email.com.br>"
    smtp_server = "seusmtp.server" #EX: "smtp.office365.com"
    smtp_user = "seuemail@email.com.br"
    smtp_pass = "suasenha"
    
    msg = MIMEMultipart()
    msg["From"] = from_email
    msg["To"] = to_email
    msg["Subject"] = subject

    # Aqui, vamos garantir que o corpo seja enviado como HTML.
    msg.attach(MIMEText(body, 'html'))  # O 'html' garante que o conteúdo será interpretado como HTML
    
    try:
        server = smtplib.SMTP(smtp_server, 587)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(from_email, to_email, msg.as_string())
        server.quit()
        logging.info(f"Email enviado para {to_email}")
    except Exception as e:
        logging.error(f"Erro ao enviar email para {to_email}: {e}")


def check_pending_mediacoes():
    conn = connect_db()
    cursor = conn.cursor(dictionary=True)
    today = datetime.now()
    today_day = today.day  # Obtém o dia atual
    
    # Consulta SQL: seleciona medições com status 'Pendente' 
    query = """
        SELECT id, user, nome, diaenvio
        FROM mediacoes
        WHERE status1 = 'Pendente'
        AND notify = '1'
        AND (deleted IS NULL OR deleted = '')
    """
    
    cursor.execute(query)
    
    for row in cursor.fetchall():
        diaenvio = row["diaenvio"]
        
        # Se o dia de envio for maior que o dia atual, não fazemos nada
        if diaenvio > today_day:
            continue
        
        # Verificando se a medição está pendente para o mês atual
        if diaenvio == today_day:  # Se o dia de envio é hoje
            subject = f"Alerta Meu Gerenciamento: Medição {row['nome']} está Pendente!"
            body = f"""
            <html>
                <body>
                    <p>A medição <strong>{row['nome']}</strong> <i>(ID: {row['id']})</i> está <span style="color:red;">pendente</span> e precisa ser enviada hoje!</p>
                    <br>
                    <br>
                    <p><small><i>Mensagem automática enviada pelo sistema Meu Gerenciamento. Powered by Ryan Ribeiro - 2025.</i></small></p>
                </body>
            </html>
            """
        
        elif diaenvio < today_day:  # Se o dia de envio já passou
            subject = f"Alerta Meu Gerenciamento: Medição {row['nome']} está Pendente!"
            body = f"""
            <html>
                <body>
                    <p>A medição <strong>{row['nome']}</strong> <i>(ID: {row['id']})</i> está <span style="color:red;">pendente</span> e já está em atraso desde o dia {diaenvio}!</p>
                    <br>
                    <br>
                    <p><small><i>Mensagem automática enviada pelo sistema Meu Gerenciamento. Powered by Ryan Ribeiro - 2025.</i></small></p>
                </body>
            </html>
            """

        email = get_email_from_ldap(row["user"])
        if email:
            send_email(email, subject, body)  # Envia o e-mail para o responsável
            logging.info(f"Alerta enviado para {email} do usuário: {row['user']} sobre a medição {row['id']}, {row['nome']}")
        else:
            logging.warning(f"Nenhum email encontrado para usuário {row['user']} da medição {row['id']}")
    
    cursor.close()
    conn.close()

def check_awaiting_nf():
    conn = connect_db()
    cursor = conn.cursor(dictionary=True)  # Garante que a consulta retorna os dados como dicionário
    current_date = datetime.now()

    # Calcular a data de 3 dias atrás
    three_days_ago = (current_date - timedelta(days=3)).strftime("%Y-%m-%d %H:%M:%S")
    logging.info(f"Data de 3 dias atrás: {three_days_ago}")  # Log para verificar

    # Consulta as medições com status 'Aguardando NF' e que o last_reset é há mais de 3 dias
    query = """
        SELECT id, user, nome, last_reset
        FROM mediacoes
        WHERE status1 = 'Aguardando NF'
        AND last_reset < %s
        AND notify = '1'
        AND (deleted IS NULL OR deleted = '')
    """
    cursor.execute(query, (three_days_ago,))
    
    rows_to_notify = cursor.fetchall()

    if rows_to_notify:
        for row in rows_to_notify:
            user = row["user"]
            medicao_id = row["id"]
            medicao_nome = row["nome"]
            last_reset = row["last_reset"]
            
            logging.info(f"Comparando: {last_reset} com {three_days_ago}")  # Log para depuração

            # Buscar o e-mail do responsável
            email = get_email_from_ldap(user)
            
            if email:
                subject = f"Alerta Meu Gerenciamento: Medição {medicao_nome} - Aguardando Nota Fiscal há mais de 3 dias"
                body = f"""
                <html>
                    <body>
                        <p>A medição <strong>{medicao_nome}</strong> <i>(ID: {medicao_id})</i> está <span style="color:yellow;">aguardando NF</span> do fornecedor há mais de 3 dias.</p>
                        <p><strong>Última data de atualização:</strong> {last_reset}</p>
                        <p><strong>Por favor, verifique se a nota fiscal já foi recebida.</strong></p>
                        <p>Se a nota fiscal já foi recebida, por favor, envie para a classificação e altere o status para 'NF Enviada'. Caso contrário, entre em contato com o fornecedor para solicitar o envio da nota fiscal.</p>
                        <br>
                        <p><small><i>Mensagem automática enviada pelo sistema Meu Gerenciamento. Powered by Ryan Ribeiro - 2025.</i></small></p>
                    </body>
                </html>
                """
                send_email(email, subject, body)  # Envia o e-mail para o responsável
                logging.info(f"E-mail enviado para {email} sobre a medição {medicao_nome} (ID: {medicao_id})")
            else:
                logging.warning(f"Nenhum e-mail encontrado para o usuário {user} da medição {medicao_nome} (ID: {medicao_id})")

    else:
        logging.info("Nenhuma medição com status 'Aguardando NF' há mais de 3 dias encontrada.")

    cursor.close()
    conn.close()


def main_task():
    logging.info("Verificando medições 'NF Enviada' do mês anterior...")
    reset_old_entries()
    logging.info("Verificando medições 'Pendentes'...")
    check_pending_mediacoes()
    logging.info("Verificando medições 'Aguardando NF'...")  
    check_awaiting_nf()
    logging.info("Tarefa completada. Aguardando próximo horário agendado...")

# Agendar a tarefa para 07:00 AM todos os dias
schedule.every().day.at("07:00").do(main_task)

def run():
    while True:
        # Verifica e executa as tarefas agendadas
        schedule.run_pending()
        time.sleep(60)  # Aguarda 1 minuto para verificar novamente (não bloqueia o processo)

if __name__ == "__main__":
    run()
