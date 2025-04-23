<?php
//session_start();

//if (!isset($_SESSION['authenticated']) || $_SESSION['authenticated'] !== true) {
// header('Location: auth');
//  exit();
//}

//if (isset($_SESSION['is_security_group_1_or_2'])) {
//} else {
//echo "A variável de grupo de segurança não foi definida.";
//}

//if (isset($_SESSION['email'])){
//}else{
//echo"Email de usuário não cadastrado para esse usuário de AD.";
//}
// Lógica de logout
//if (isset($_GET['logout'])) {
//  session_destroy();
//header('Location: auth');
//exit();
//}

//$name = $_SESSION['name'];

?>

<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <title>Menu Gerenciamento</title>
    <link rel="stylesheet" href="stylemenu.css">
    <link rel="icon" type="image/x-icon" href="./assets/logo.png">
    <link rel="stylesheet" href="./fontawesome/css/all.css" />
    <link rel="stylesheet" href="./fontawesome/css/v4-shims.css" />
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

</head>

<body>
    <div id="container">
        <div id="profile">
            <a href="https://www.pirecal.com.br/">
                <img src="assets/pic-logomarca-pirecal-neutra.webp" title="Pirecal">
            </a>
        </div>
        <ul>
            <!-- Mostrar Chaves VPN apenas para os grupos 1 e 2 -->
            <?php if (isset($_SESSION['is_security_group_1_or_2']) && $_SESSION['is_security_group_1_or_2']): ?>
                <!-- <li><a href="VPN">Chaves VPN</a></li> -->
            <?php endif; ?>

            <li><a href="Medicao">Gerenciamento de Contratos</a></li>
            <!-- <li><a href="RelFrota">Relatório de Frota</a></li> -->

        </ul>
        <footer>
            <a>&copy; 2025 - Ryan Ribeiro Oliveira.</a>
        </footer>
    </div>
</body>

</html>