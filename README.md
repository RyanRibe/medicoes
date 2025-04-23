# Medições

**Medições** é uma aplicação web desenvolvida para gerenciar o controle de contratos de fornecedores e contas recorrentes. A plataforma permite realizar integrações com o **TOTVS Protheus**, automatizar comunicações com fornecedores e gerar arquivos PDF com os dados extraídos dos contratos e pedidos de compras. Além disso, a aplicação conta com um backend em Python para disparar alertas via e-mail relacionados aos vencimentos de contratos e contas, além de realizar o reset mensal dos status de cada contrato/conta.

## Funcionalidades

### 1. **Controle de Contratos e Contas Recorrentes**

- **Cadastro e gestão de contratos** de fornecedores e contas recorrentes.
- Acompanhamento das **datas de vencimento**, **valores** e **status** dos contratos.
- **Exibição de informações detalhadas** sobre cada contrato e suas medições.

### 2. **Integração com TOTVS Protheus**

- A aplicação se integra com o **TOTVS Protheus** para **buscar pedidos de compras** relacionados aos contratos.
- **Importação automática de dados** do sistema Protheus para o controle de contratos, evitando erros manuais.

### 3. **Mensagens Automáticas para Fornecedores**

- Envio de **mensagens automáticas** para fornecedores com informações sobre faturamento, via WhatsApp e/ou e-mail.

### 4. **Geração de Dados em PDF**

- Geração de **PDFs** com informações detalhadas sobre os contratos e medições.
- **PDF-lib** é utilizada para criar e personalizar os relatórios diretamente dentro da aplicação.

### 5. **API Python para Alertas e Notificações**

- Server em Python é responsável por:
  - Enviar **alertas via e-mail** sobre atrasos na medição dos contratos.
  - Notificar sobre **vencimentos próximos**, garantindo que os responsáveis estejam cientes.
  - **Resetar os status** dos contratos todo início de mês, garantindo um controle contínuo e organizado.

## Tecnologias Utilizadas

- **Frontend:**
  - HTML
  - CSS
  - JavaScript
- **Backend:**
  - PHP
  - Composer
  - DB MySql
- **Integração:**
  - **TOTVS Protheus**
- **PDF:**
  - PDF-lib
- **API Python:**
  - Python
  - SMTP (para envio de e-mails)

## Roadmap

- [ ] Integração com outras plataformas ERP.
- [ ] Notificações via e-mail.
- [ ] Otimização de performance para grandes volumes de contratos.
- [ ] Dashboard de relatórios com visualizações interativas.

## Contribuição

1. **Fork** o repositório.
2. Crie uma **branch** para sua feature (`git checkout -b feature/nome-da-feature`).
3. Faça suas alterações e **commit** com uma mensagem clara.
4. **Push** para sua branch (`git push origin feature/nome-da-feature`).
5. Abra um **pull request** para a branch principal.

## Licença

Distribuído sob a licença MIT.

## Contato

Se tiver alguma dúvida ou sugestão, sinta-se à vontade para abrir uma **issue** ou entrar em contato diretamente.

- **Autor:** Ryan Ribeiro Oliveira
- **E-mail:** ryanrybeiro123@gmail.com
- **GitHub:** [https://github.com/RyanRibe](https://github.com/RyanRibe)
- **LinkedIn:** [https://www.linkedin.com/in/ryan-ribe/](https://www.linkedin.com/in/ryan-ribe/)
