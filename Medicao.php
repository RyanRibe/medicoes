<?php
//session_start();

//if (!isset($_SESSION['authenticated']) || $_SESSION['authenticated'] !== true) {
//header('Location: auth');
//exit();
//}

// Lógica de logout
//if (isset($_GET['logout'])) {
//session_destroy();
//header('Location: auth');
//exit();
//}

//$username = $_SESSION['username'];
//$name = $_SESSION['name'];

?>
<!DOCTYPE html>
<html lang="pt-BR">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/x-icon" href="./assets/logo.png" />
  <title>Planilhas de Contratos</title>
  <link rel="stylesheet" href="./stylesmedicao.css">
  <link rel="stylesheet" href="./fontawesome/css/all.css" />
  <link rel="stylesheet" href="./fontawesome/css/v4-shims.css" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>


</head>
<a id="backpag" href="Menu" title="Voltar"></a>


<body>
  <div id="month-box">
    Mês vigente: <span id="current-month"></span>
  </div>


  <div title="Nome do usuário" id="user-box">
    <i class="fa-regular fa-user"></i>
    <span id="current-user"><?php echo $name; ?></span>
  </div>

  <div class="logout-box">
    <a href="?logout=true" title="Fazer logout" style="font-family: Arial, sans-serif;text-decoration:none;color:white;">
      <i title="Fazer logout" class="fa fa-sign-out" style="margin:5px;font-size:22px;"></i>
      <span style="font-size:10px;text-decoration:none;position: relative; top: -5px; left:-5px;">Sair</span>
    </a>
  </div>

  <input type="hidden" id="username" value="<?php echo $username; ?>">


  <div class="wrapper">
    <div class="content">
      <div class="container">
        <aside id="sidebar" class="show">
          <h2 id="menumed">Menu de Medições <br><i id="version"> Versão 2.3</i></h2>
          <nav>
            <ul id="menu"></ul>
            <a id="addBUTT" title="Adicionar novo bloco de contratos."></a>
            <a id="cfg" href="cfgmed" title="Configurar contatos dos fornecedores das medições.">Configurações</a>
          </nav>
        </aside>
        <main>
          <section id="content">
            <h2>Bem-vindo ao sistema de gerenciamento de medicões</h2>
            <p>Selecione uma medição no menu para visualizar.</p>
          </section>
          <div id="swipe-message" class="swipe-message">
            Toque em qualquer canto da tela para acessar novamente o menu.
          </div>
        </main>
      </div>
    </div>

    <div styles='display:none;' id="mensagemModal" class="mensagemModal">
      <div class="mensagemModal-content">
        <span class="close2">&times;</span>
        <h2 style="color: black; text-align: center;">Confirmar</h2>
        <br>
        <p id="pMensagem" style="color: black; text-align: center;">Tem certeza que deseja excluir?</p>
        <br>
        <div class="confirmation-buttons">
          <button id="btnConfirmarComando">Sim</button>
          <button id="btnCancelarComando">Cancelar</button>
        </div>
      </div>
    </div>

    <div id="modalMedicao" class="modal">
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>Adicionar Medição</h2>

        <h3>Cabeçalho</h3>
        <label>Nome do Fornecedor*: <input type="text" id="nome" required></label>
        <label>Dia de Vencimento*: <input type="number" id="diaenvio" maxlength="2" required></label>
        <label>Telefone do Fornecedor: <input type="text" id="ctt" placeholder="Somente números, com DDD." maxlength="14"></label>
        <label>Email do Fornecedor: <input type="text" id="emailforn" placeholder="exemplo@mail.com" maxlength="50"></label>


        <h3>Contrato 1</h3>
        <label>Filial*:
          <select class="filiais" type="text" id="filial1" maxlength="6" required>
            <option value="010101">
              010101 - Matriz
            </option>
            <option value="010102">
              010102 - Filial
            </option>
            <option value="030101">
              030101 - Mineração
            </option>
            <option value="050101">
              050101 - MJ
            </option>
          </select>
        </label>
        <label>Nº Contrato*: <input type="text" id="ctr1" required></label>
        <label>Descrição*: <input type="text" id="desc1" required>
          <label>Valor R$*: <input type="text" id="valor1" required></label>

          <div id="extraContratos"></div>
          <button id="addContrato">Adicionar Mais Contrato</button>

          <button id="salvarMedicao">Salvar</button>
      </div>
    </div>


    <div id="gravar-modal" style="color:black;display:none; position: fixed; top:0; left:0; width:100%; height:100%; background-color: rgba(0,0,0,0.5); z-index:1000; justify-content:center; align-items:center;">
      <div style="background:white; padding:20px; border-radius:10px; width: 600px; text-align: center;">
        <title>Gerar PDFs e Enviar por E-mail</title>

        <body>
          <h2>Gravar Dados</h2>
          <!-- Botão para upload de PDF -->
          <input type="file" id="pdf-upload" accept="application/pdf" />
          <br><br>
          <div id="contratoSelector"></div>
        </body>
      </div>
    </div>


    <div id="loadingModal">
      <img src="./assets/load.gif" alt="Carregando...">
    </div>

    <footer>
      <a>&copy; 2025 - Ryan Ribeiro Oliveira.</a>
    </footer>
  </div>
  <script src="scriptmedicao.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
</body>

</html>