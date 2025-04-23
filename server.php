<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
date_default_timezone_set('America/Sao_Paulo'); // Defina o fuso horário de acordo com sua localização

// Conexão com o banco de dados existente
$dbHost = 'localhost';
$dbPort = '3306';
$dbName = 'SEUBANCO'; //seu banco
$dbUser = 'user'; 
$dbPass = 'pswrd';


try {
    $pdo = new PDO("mysql:host=$dbHost;port=$dbPort;dbname=$dbName", $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Erro ao conectar ao banco de dados: " . $e->getMessage());
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'addMedicao':
        handleAddMedicao();
        break;
    case 'listMedicoes':
        handleListMedicoes();
        break;
    case 'updateMedicao':
        handleUpdateMedicao();
        break;
    case 'checkAndResetStatus':
        checkAndResetStatus();
        break;
    case 'getMedicaoCtt': 
        handleGetMedicaoCtt();
        break;
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Ação não suportada']);
}



function checkAndResetStatus()
{
    global $pdo;

    header('Content-Type: application/json'); // Certifique-se de que o cabeçalho da resposta seja JSON

    try {
        $today = new DateTime();
        $currentMonth = $today->format('Y-m');

        // Verifica as medições que precisam ser resetadas
        $stmt = $pdo->prepare("
            SELECT id, nome, last_reset 
            FROM mediacoes 
            WHERE last_reset IS NULL OR DATE_FORMAT(last_reset, '%Y-%m') < :currentMonth
        ");
        $stmt->bindParam(':currentMonth', $currentMonth);
        $stmt->execute();
        $medicoes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $resetNames = []; // Lista para armazenar os nomes das medições resetadas

        if (count($medicoes) > 0) {
            foreach ($medicoes as $medicao) {
                $todayFormatted = $today->format('Y-m-d'); // Salva o formato em uma variável

                $resetStmt = $pdo->prepare("
                    UPDATE mediacoes 
                    SET status1 = 'Pendente', 
                        status2 = 'Pendente', 
                        status3 = 'Pendente', 
                        status4 = 'Pendente', 
                        last_reset = :today 
                    WHERE id = :id
                ");
                $resetStmt->bindParam(':today', $todayFormatted); // Usa a variável em vez do método direto
                $resetStmt->bindParam(':id', $medicao['id'], PDO::PARAM_INT);
                $resetStmt->execute();

                // Adiciona o nome da medição à lista de resetadas
                $resetNames[] = $medicao['nome'];
            }

            echo json_encode(['success' => true, 'message' => 'Medições resetadas com sucesso.', 'resetNames' => $resetNames]);
        } else {
            // Apenas loga a informação no console sem enviar resposta para o usuário
            // Envia uma resposta JSON vazia
            echo json_encode(['success' => true, 'message' => 'Nenhuma medição necessitou de reset.']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao resetar status das medições: ' . $e->getMessage()]);
    }
}


function handleGetMedicaoCtt()
{
    global $pdo;

    $id = isset($_GET['id']) ? intval($_GET['id']) : null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID da medição não especificado']);
        return;
    }

    try {
        // Modificando a consulta para pegar também o campo 'email'
        $stmt = $pdo->prepare("SELECT ctt, email FROM mediacoes WHERE id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        $medicao = $stmt->fetch(PDO::FETCH_ASSOC);

        // Verificando se o 'ctt' ou 'email' estão disponíveis
        if ($medicao && (!empty($medicao['ctt']) || !empty($medicao['email']))) {
            echo json_encode([
                'ctt' => $medicao['ctt'],
                'email' => $medicao['email']
            ]);
        } else {
            echo json_encode(['error' => 'Contato ou email não configurado para essa medição']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao obter contato: ' . $e->getMessage()]);
    }
}

function handleAddMedicao()
{
    global $pdo;

    // Recupera os dados enviados no POST
    $input = json_decode(file_get_contents('php://input'), true);

    // Campos obrigatórios
    $nome = $input['nome'] ?? null;
    $diaenvio = $input['diaenvio'] ?? null;
    $ctt = $input['ctt'] ?? '+5562999990000'; // Valor padrão se não informado
    $email = $input['emailforn'] ?? null;
    $last_reset = date('Y-m-d'); // Define como hoje

    // Recuperar o username do POST
    $username = $input['username'] ?? null;

    // Contratos obrigatórios
    $ctr1 = $input['ctr1'] ?? null;
    $desc1 = $input['desc1'] ?? null;
    $filial1 = $input['filial1'] ?? null;
    $valor1 = $input['valor1'] ?? null;

    // Contratos adicionais (opcionais)
    $ctr2 = $input['ctr2'] ?? null;
    $desc2 = $input['desc2'] ?? null;
    $filial2 = $input['filial2'] ?? null;
    $valor2 = $input['valor2'] ?? null;

    $ctr3 = $input['ctr3'] ?? null;
    $desc3 = $input['desc3'] ?? null;
    $filial3 = $input['filial3'] ?? null;
    $valor3 = $input['valor3'] ?? null;

    $ctr4 = $input['ctr4'] ?? null;
    $desc4 = $input['desc4'] ?? null;
    $filial4 = $input['filial4'] ?? null;
    $valor4 = $input['valor4'] ?? null;

    // Verifica se os campos obrigatórios foram preenchidos
    if (!$nome || !$diaenvio || !$ctr1 || !$valor1 || !$username) {
        http_response_code(400);
        echo json_encode(['error' => 'Campos obrigatórios não preenchidos']);
        return;
    }

    try {
        // Preparando o SQL para inserção, agora com o campo 'user'
        $stmt = $pdo->prepare("
            INSERT INTO mediacoes (
                nome, diaenvio, ctt, email, last_reset, user,
                ctr1, desc1, filial1, valor1,
                ctr2, desc2, filial2, valor2,
                ctr3, desc3, filial3, valor3,
                ctr4, desc4, filial4, valor4
            ) VALUES (
                :nome, :diaenvio, :ctt, :email, :last_reset, :user,
                :ctr1, :desc1, :filial1, :valor1,
                :ctr2, :desc2, :filial2, :valor2,
                :ctr3, :desc3, :filial3, :valor3,
                :ctr4, :desc4, :filial4, :valor4
            )
        ");

        // Bind de parâmetros, incluindo o 'user'
        $stmt->bindParam(':nome', $nome);
        $stmt->bindParam(':diaenvio', $diaenvio, PDO::PARAM_INT);
        $stmt->bindParam(':ctt', $ctt);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':last_reset', $last_reset);
        $stmt->bindParam(':user', $username);  // Aqui está o username vindo do POST

        // Restante dos binds dos contratos
        $stmt->bindParam(':ctr1', $ctr1);
        $stmt->bindParam(':desc1', $desc1);
        $stmt->bindParam(':filial1', $filial1);
        $stmt->bindParam(':valor1', $valor1, PDO::PARAM_STR);

        $stmt->bindParam(':ctr2', $ctr2);
        $stmt->bindParam(':desc2', $desc2);
        $stmt->bindParam(':filial2', $filial2);
        $stmt->bindParam(':valor2', $valor2, PDO::PARAM_STR);

        $stmt->bindParam(':ctr3', $ctr3);
        $stmt->bindParam(':desc3', $desc3);
        $stmt->bindParam(':filial3', $filial3);
        $stmt->bindParam(':valor3', $valor3, PDO::PARAM_STR);

        $stmt->bindParam(':ctr4', $ctr4);
        $stmt->bindParam(':desc4', $desc4);
        $stmt->bindParam(':filial4', $filial4);
        $stmt->bindParam(':valor4', $valor4, PDO::PARAM_STR);

        $stmt->execute();

        echo json_encode(['success' => true, 'message' => 'Medição adicionada com sucesso!']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao adicionar medição: ' . $e->getMessage()]);
    }
}



function handleListMedicoes()
{
    global $pdo;

    try {
        // Captura o username da sessão
        session_start();
        if (!isset($_SESSION['username'])) {
            echo json_encode(['error' => 'Usuário não autenticado']);
            return;
        }

        $username = $_SESSION['username']; // Obtém o username da sessão

        $id = isset($_GET['id']) ? intval($_GET['id']) : null;

        if ($id) {
            // Consulta para uma medição específica, incluindo o filtro pelo username
            $stmt = $pdo->prepare("SELECT * FROM mediacoes WHERE id = :id AND user = :username AND deleted IS NULL OR deleted = ''");
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->bindParam(':username', $username, PDO::PARAM_STR);
            $stmt->execute();
            $medicoes = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (empty($medicoes)) {
                error_log("Medição com ID $id para o usuário $username não encontrada.");
            }
        } else {
            // Consulta para todas as medições do usuário, incluindo o filtro pelo username
            $stmt = $pdo->prepare("SELECT * FROM mediacoes WHERE user = :username AND deleted IS NULL OR deleted = ''");
            $stmt->bindParam(':username', $username, PDO::PARAM_STR);
            $stmt->execute();
            $medicoes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        echo json_encode($medicoes);
    } catch (PDOException $e) {
        error_log("Erro ao listar medições: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao listar medições: ' . $e->getMessage()]);
    }
}


function handleUpdateMedicao()
{
    global $pdo;

    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? null;
    $nome = $input['nome'] ?? null;
    $ctt = $input['ctt'] ?? null;
    $email = $input['email'] ?? null;
    $statusField = $input['statusField'] ?? null;
    $status = $input['status'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID da medição não especificado']);
        return;
    }

    try {
        $query = "UPDATE mediacoes SET ";
        $params = [];

        // Monta a query dinamicamente apenas com os campos fornecidos
        if ($nome !== null) {
            $query .= "nome = :nome, ";
            $params[':nome'] = $nome;
        }

        if ($ctt !== null) {
            $query .= "ctt = :ctt, ";
            $params[':ctt'] = $ctt;
        }

        if ($email !== null) {
            $query .= "email = :email, ";
            $params[':email'] = $email;
        }

        if ($statusField && $status) {
            $query .= "$statusField = :status, last_reset = :last_reset, ";
            $params[':status'] = $status;
            $params[':last_reset'] = date('Y-m-d');
        }

        // Remove a última vírgula e espaço
        $query = rtrim($query, ', ');

        $query .= " WHERE id = :id";
        $params[':id'] = $id;

        $stmt = $pdo->prepare($query);

        // Bind os parâmetros dinamicamente
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        $stmt->execute();

        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        error_log("Erro ao atualizar medição: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao atualizar medição: ' . $e->getMessage()]);
    }
}



error_log("Recebendo requisição...");
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    error_log("Dados recebidos: " . file_get_contents('php://input'));
}


function connectSQLServer()
{
    $serverName = //CONEXAO COM O SEU DB PROTHEUS
    $database = //CONEXAO COM O SEU DB PROTHEUS
    $username = //CONEXAO COM O SEU DB PROTHEUS
    $password = //CONEXAO COM O SEU DB PROTHEUS

    try {
        $conn = new PDO(
            "sqlsrv:server=$serverName;Database=$database;TrustServerCertificate=yes",
            $username,
            $password
        );
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $conn;
    } catch (PDOException $e) {
        die(json_encode(["error" => "Erro na conexão com SQL Server: " . $e->getMessage()]));
    }
}



function buscarUltimoPedido($ctr, $filial)
{
    $conn = connectSQLServer();

    $sql = "SELECT TOP 1 C7_NUM FROM SC7010 WHERE C7_CONTRA = :ctr AND C7_FILIAL = :filial AND D_E_L_E_T_ = '' ORDER BY C7_EMISSAO DESC, C7_NUM DESC";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(":ctr", $ctr, PDO::PARAM_STR);
    $stmt->bindParam(":filial", $filial, PDO::PARAM_STR);
    $stmt->execute();

    $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
    return $resultado ? $resultado["C7_NUM"] : null;
}

function buscarUltimoValor($ctr, $filial)
{
    $conn = connectSQLServer();

    $sql = "SELECT TOP 1 C7_TOTAL FROM SC7010 WHERE C7_CONTRA = :ctr AND C7_FILIAL = :filial AND D_E_L_E_T_ = '' ORDER BY C7_EMISSAO DESC, C7_NUM DESC";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(":ctr", $ctr, PDO::PARAM_STR);
    $stmt->bindParam(":filial", $filial, PDO::PARAM_STR);
    $stmt->execute();

    $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
    return $resultado ? $resultado["C7_TOTAL"] : null;
}

function atualizarUltimosPedidos($medicaoId)
{
    global $pdo; 

    // Buscar os dados da medição
    $sql = "SELECT id, filial1, ctr1, filial2, ctr2, filial3, ctr3, filial4, ctr4 FROM mediacoes WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(":id", $medicaoId, PDO::PARAM_INT);
    $stmt->execute();
    $medicao = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$medicao) {
        return ["success" => false, "error" => "Medição não encontrada."];
    }

    // Buscar os valores no SQL Server
    $ultped1 = buscarUltimoPedido($medicao['ctr1'], $medicao['filial1']);
    $ultped2 = $medicao['ctr2'] ? buscarUltimoPedido($medicao['ctr2'], $medicao['filial2']) : null;
    $ultped3 = $medicao['ctr3'] ? buscarUltimoPedido($medicao['ctr3'], $medicao['filial3']) : null;
    $ultped4 = $medicao['ctr4'] ? buscarUltimoPedido($medicao['ctr4'], $medicao['filial4']) : null;

    $ultvalor1 = buscarUltimoValor($medicao['ctr1'], $medicao['filial1']);
    $ultvalor2 = $medicao['ctr2'] ? buscarUltimoValor($medicao['ctr2'], $medicao['filial2']) : null;
    $ultvalor3 = $medicao['ctr3'] ? buscarUltimoValor($medicao['ctr3'], $medicao['filial3']) : null;
    $ultvalor4 = $medicao['ctr4'] ? buscarUltimoValor($medicao['ctr4'], $medicao['filial4']) : null;

    // Atualizar os valores no MySQL
    $sqlUpdate = "UPDATE mediacoes SET ultped1 = :ultped1, ultped2 = :ultped2, ultped3 = :ultped3, ultped4 = :ultped4, ultvalor1 = :ultvalor1, ultvalor2 = :ultvalor2, ultvalor3 = :ultvalor3, ultvalor4 = :ultvalor4 WHERE id = :id";
    $stmtUpdate = $pdo->prepare($sqlUpdate);
    $stmtUpdate->bindParam(":ultped1", $ultped1);
    $stmtUpdate->bindParam(":ultped2", $ultped2);
    $stmtUpdate->bindParam(":ultped3", $ultped3);
    $stmtUpdate->bindParam(":ultped4", $ultped4);
    $stmtUpdate->bindParam(":ultvalor1", $ultvalor1);
    $stmtUpdate->bindParam(":ultvalor2", $ultvalor2);
    $stmtUpdate->bindParam(":ultvalor3", $ultvalor3);
    $stmtUpdate->bindParam(":ultvalor4", $ultvalor4);
    $stmtUpdate->bindParam(":id", $medicaoId, PDO::PARAM_INT);
    $stmtUpdate->execute();

    return ["success" => true, "message" => "Dados atualizados com sucesso."];
}

function atualizarEnviado($medicaoId)
{
    global $pdo; 

    // Buscar os dados da medição
    $sql = "SELECT id, ultped1, ultped2, ultped3, ultped4 FROM mediacoes WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(":id", $medicaoId, PDO::PARAM_INT);
    $stmt->execute();
    $medicao = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$medicao) {
        return ["success" => false, "error" => "Medição não encontrada."];
    }

    // Extrair os valores corretamente
    $ultped1 = $medicao["ultped1"];
    $ultped2 = $medicao["ultped2"];
    $ultped3 = $medicao["ultped3"];
    $ultped4 = $medicao["ultped4"];

    // Atualizar os valores no MySQL
    $sqlUpdate = "UPDATE mediacoes SET pedenv1 = :ultped1, pedenv2 = :ultped2, pedenv3 = :ultped3, pedenv4 = :ultped4 WHERE id = :id";
    $stmtUpdate = $pdo->prepare($sqlUpdate);
    $stmtUpdate->bindParam(":ultped1", $ultped1);
    $stmtUpdate->bindParam(":ultped2", $ultped2);
    $stmtUpdate->bindParam(":ultped3", $ultped3);
    $stmtUpdate->bindParam(":ultped4", $ultped4);
    $stmtUpdate->bindParam(":id", $medicaoId, PDO::PARAM_INT);
    $stmtUpdate->execute();

    return ["success" => true, "message" => "Dados atualizados com sucesso."];
}

function deletMedicao($medicaoId)
{
    global $pdo; 

    // Atualizar os valores no MySQL
    $sqlUpdate = "UPDATE mediacoes SET deleted = '*' WHERE id = :id";
    $stmtUpdate = $pdo->prepare($sqlUpdate);
    $stmtUpdate->bindParam(":id", $medicaoId, PDO::PARAM_INT);
    $stmtUpdate->execute();

    return ["success" => true, "message" => "Medicao deletada com sucesso."];
}

if (isset($_GET['action']) && $_GET['action'] == 'updatePedidos') {
    // Capturar JSON do corpo da requisição
    $dados = json_decode(file_get_contents('php://input'), true);
    $medicaoId = $dados['medicaoId'] ?? null;

    // Verificar se o medicaoId foi recebido corretamente
    if (!$medicaoId) {
        echo json_encode(["success" => false, "error" => "medicaoId não recebido"]);
        exit;
    }

    // Chamar a função para atualizar os pedidos
    $response = atualizarUltimosPedidos($medicaoId);
    echo json_encode($response);
    exit;
}

if ($_GET['action'] === 'atualizarEnviado') {
    // Capturar dados da requisição (independente do formato)
    $inputJSON = file_get_contents("php://input");
    $dados = json_decode($inputJSON, true);

    // Se JSON não foi enviado, tenta pegar de $_POST
    $medicaoId = $dados['medicaoId'] ?? $_POST['medicaoId'] ?? null;

    // Verifica se o ID foi recebido corretamente
    if (!$medicaoId) {
        echo json_encode(["success" => false, "error" => "medicaoId não recebido"]);
        exit;
    }

    // Chamar a função e capturar a resposta
    $response = atualizarEnviado($medicaoId);

    // Garantir que nenhum outro output polua o JSON
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}

function deleteMedicao($medicaoId)
{
    global $pdo; 

    if (!$medicaoId) {
        // Se o ID da medição não for fornecido, retorna erro
        return ['error' => 'ID da medição não fornecido'];
    }

    try {
        // Prepara a consulta para marcar a medição como deletada
        $stmt = $pdo->prepare("UPDATE mediacoes SET deleted = '*' WHERE id = :id");
        $stmt->bindParam(':id', $medicaoId, PDO::PARAM_INT);

        // Executa a consulta
        $stmt->execute();

        // Verifica se alguma linha foi afetada
        if ($stmt->rowCount() > 0) {
            return ['success' => 'Medição marcada como deletada'];
        } else {
            return ['error' => 'Medição não encontrada ou já foi marcada como deletada'];
        }
    } catch (PDOException $e) {
        // Se houver um erro na execução, retorna o erro
        return ['error' => 'Erro ao marcar a medição como deletada: ' . $e->getMessage()];
    }
}

function desactivenotify($medicaoId)
{
    global $pdo; 

    header('Content-Type: application/json'); // Define JSON apenas para essa função

    if (!$medicaoId) {
        echo json_encode(['error' => 'ID da medição não fornecido']);
        return;
    }

    try {
        $stmt = $pdo->prepare("UPDATE mediacoes SET notify = '0' WHERE id = :id");
        $stmt->bindParam(':id', $medicaoId, PDO::PARAM_INT);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => 'Desativada a notificação para essa medição!']);
        } else {
            echo json_encode(['error' => 'Medição não encontrada']);
        }
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Erro ao desativar a notificação: ' . $e->getMessage()]);
    }
}

function activenotify($medicaoId)
{
    global $pdo;  

    header('Content-Type: application/json'); // Define JSON apenas para essa função

    if (!$medicaoId) {
        echo json_encode(['error' => 'ID da medição não fornecido']);
        return;
    }

    try {
        $stmt = $pdo->prepare("UPDATE mediacoes SET notify = '1' WHERE id = :id");
        $stmt->bindParam(':id', $medicaoId, PDO::PARAM_INT);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => 'Ativada a notificação para essa medição!']);
        } else {
            echo json_encode(['error' => 'Medição não encontrada']);
        }
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Erro ao ativar a notificação: ' . $e->getMessage()]);
    }
}

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['action']) && $_POST['action'] == 'deleteMedicao') {
    $medicaoId = isset($_POST['id']) ? $_POST['id'] : null;

    if (!$medicaoId) {
        echo json_encode(['error' => 'ID da medição não fornecido']);
        exit;
    }

    try {
        // Executa a exclusão
        $response = deleteMedicao($medicaoId);  // Chama a função de exclusão

        echo json_encode($response);  // Retorna resposta como JSON
    } catch (Exception $e) {
        echo json_encode(['error' => 'Erro ao excluir medição: ' . $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['action'])) {
    $medicaoId = isset($_POST['id']) ? $_POST['id'] : null;

    if (!$medicaoId) {
        header('Content-Type: application/json');
        echo json_encode(['error' => 'ID da medição não fornecido']);
        exit;
    }

    try {
        if ($_POST['action'] == 'desactivenotify') {
            desactivenotify($medicaoId);
        } elseif ($_POST['action'] == 'activenotify') {
            activenotify($medicaoId);
        } else {
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Ação inválida']);
        }
    } catch (Exception $e) {
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Erro ao processar a ação: ' . $e->getMessage()]);
    }
    exit;
}


