<?php //SUA CONFG DE SESSAO
//session_start();

//if (!isset($_SESSION['authenticated']) || $_SESSION['authenticated'] !== true) {
// header('Location: auth.php');
//exit();
//}

//$name = $_SESSION['name'];

?>

<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Configurações de Medições</title>
    <link rel="stylesheet" href="./stylesmedicao.css">
    <link rel="stylesheet" href="./fontawesome/css/all.css" />
    <link rel="stylesheet" href="./fontawesome/css/v4-shims.css" />

</head>
<a id="backpag" href="Medicao" title="Voltar"></a>
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

<body>
    <div class="wrapper">
        <div class="content">
            <h1>Configurações de Medições</h1>
            <form id="config-form">
                <ul id="config-list"></ul>
                <!--   <button type="button" id="add-button">Adicionar Medição</button> -->
                <button type="submit">Salvar Configurações</button>
            </form>
        </div>
    </div>
    <script src="cfgmed.js"></script>
</body>

</html>