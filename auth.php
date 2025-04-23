<?php
session_start();

// Configurações LDAP
$ldap_server = //SEU LDAP SERVER
    $ldap_port = ///PORTA 389
    $base_dn = // DN DO SEU ADD
    $security_group = // OPCIONAL 
    $security_group2 = // OPCIONAL 
    $security_group3 = // OPCIONAL 

    // Captura as credenciais do usuário
    $username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';

$username = strtolower($username);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (empty($username) || empty($password)) {
        die("Usuário ou senha não fornecidos.");
    }

    // Conectar ao servidor LDAP
    $ldap_connection = ldap_connect($ldap_server, $ldap_port);
    if (!$ldap_connection) {
        die("Não foi possível conectar ao servidor LDAP.");
    }

    // Configurar opções LDAP
    ldap_set_option($ldap_connection, LDAP_OPT_PROTOCOL_VERSION, 3);
    ldap_set_option($ldap_connection, LDAP_OPT_REFERRALS, 0);

    // Tentar autenticar o usuário
    $user_dn_upn = "$username@seu.dn"; // Formato UPN
    $user_dn_sam = "SEUDN\\$username";   // Formato SAM

    $auth_success = false;

    if (@ldap_bind($ldap_connection, $user_dn_upn, $password)) {
        $auth_success = true;
    } elseif (@ldap_bind($ldap_connection, $user_dn_sam, $password)) {
        $auth_success = true;
    }

    if (!$auth_success) {
        die("Usuário ou senha inválidos.");
    }

    // Verificar se o usuário pertence aos grupos de segurança
    $filter = "(&(sAMAccountName=$username)(|(memberOf=$security_group)(memberOf=$security_group2)(memberOf=$security_group3)))";
    $search = ldap_search($ldap_connection, $base_dn, $filter, ["*"]);

    if (!$search) {
        $_SESSION['error'] = "Erro ao buscar informações no LDAP.";
        header("Location: auth.php");
        exit();
    }

    $entries = ldap_get_entries($ldap_connection, $search);

    if ($entries['count'] > 0) {
        // Armazenar se o usuário pertence aos grupos GTi ou GTiRestrito
        $is_security_group_1_or_2 = false;
        $email = '';  // Inicializar a variável de email
        $name = '';

        foreach ($entries as $entry) {
            // Verifique se a chave 'memberof' existe e é um array
            if (isset($entry['memberof']) && is_array($entry['memberof'])) {
                // Verificar se o usuário pertence ao grupo GTi ou GTiRestrito
                if (in_array($security_group, $entry['memberof']) || in_array($security_group2, $entry['memberof'])) {
                    $is_security_group_1_or_2 = true;
                }
            }

            // Capturar o email, se disponível
            if (isset($entry['mail'][0])) {
                $email = $entry['mail'][0];
            }

            if (isset($entry['name'][0])) {
                $name = $entry['name'][0];
            }
        }

        // Armazenar os dados de sessão
        $_SESSION['authenticated'] = true;
        $_SESSION['username'] = $username;
        $_SESSION['password'] = $password;
        $_SESSION['email'] = $email;  // Armazenar o email na sessão
        $_SESSION['name'] = $name;

        $_SESSION['is_security_group_1_or_2'] = $is_security_group_1_or_2;

        header("Location: menu");
        exit();
    } else {
        $_SESSION['error'] = "Acesso negado. Você não pertence ao grupo GTi.";
        header("Location: auth.php");
        exit();
    }

    // Fechar a conexão LDAP
    ldap_unbind($ldap_connection);
}
?>

<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/x-icon" href="./assets/logo.png">
    <title>Login - Meu Gerenciamento</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: url(./assets/bk.jpg) repeat;
            background-position: top center;
            background-size: cover;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }

        :root {
            --text-color: white;
            --bg-url: url(./assets/bk.jpg);
            --stroke-color: rgba(255, 255, 255, 0.5);
            --surface-color: rgba(255, 255, 255, 0.1);
            --surface-color-hover: rgba(255, 255, 255, 0.5);
            --highlight-color: rgba(255, 255, 255, 0.2);

        }

        .login-container {
            padding: 30px;
            background: var(--surface-color);
            border: 1px solid var(--stroke-color);
            border-radius: 8px;
            width: 300px;
            text-align: left;

            backdrop-filter: blur(10px);
            text-decoration: none;
            font-weight: 500;
        }

        .login-container h1 {
            margin-bottom: 20px;
        }

        .login-container input {
            width: 90%;
            color: #fff;
            background: var(--surface-color);
            border: 1px solid var(--stroke-color);
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
        }

        .login-container input::placeholder {
            color: #fff;
        }

        .login-button {
            text-align: center;
        }

        .login-container button {
            width: 220px;
            padding: 10px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }

        .login-container button:hover {
            background-color: #0056b3;
        }

        .error {
            color: red;
            margin-top: 10px;
        }
    </style>
</head>

<body>
    <div class="login-container">
        <h1 style="color: #fff; max-height: 20px;">Login</h1>
        <form action="auth.php" method="POST">
            <input type="text" name="username" placeholder="Usuário" autocomplete="off" required>
            <input type="password" name="password" placeholder="Senha" autocomplete="off" required>
            <div class="login-button">
                <button type="submit">Entrar</button>
            </div>
        </form>
    </div>
</body>

</html>