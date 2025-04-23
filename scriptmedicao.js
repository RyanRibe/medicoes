document.addEventListener("DOMContentLoaded", function () {
  const menu = document.getElementById("menu");

  displayCurrentMonth();

  function showLoadingModal() {
    document.getElementById("loadingModal").style.display = "flex";
  }
  function hideLoadingModal() {
    document.getElementById("loadingModal").style.display = "none";
  }

  function checkAndResetStatus() {
    fetch("server.php?action=checkAndResetStatus")
      .then((response) => response.text())
      .then((data) => {
        try {
          const jsonData = JSON.parse(data); // Tenta converter a resposta para JSON
          console.log("Resposta do servidor:", jsonData.message);

          if (jsonData.resetNames && jsonData.resetNames.length > 0) {
            alert(
              "As seguintes medições foram resetadas: " +
                jsonData.resetNames.join(", ")
            );
          } else {
            console.log("Nenhuma medição necessitou de reset.");
          }

          // Após resetar os status, carrega as medições
          loadMedicoes();
        } catch (error) {
          console.error("Erro ao analisar JSON:", error);
          console.log("Resposta recebida do servidor:", data);
          alert(
            "Erro ao verificar e resetar status. Resposta inesperada do servidor."
          );
        }
      })
      .catch((error) =>
        console.error("Erro ao verificar e resetar status:", error)
      );
  }

  function loadMedicoes() {
    fetch("server.php?action=listMedicoes")
      .then((response) => response.json())
      .then((data) => {
        const groupedData = groupByDiaenvio(data); // Agrupa as medições pelo dia de envio
        renderMenu(groupedData);
      })
      .catch((error) => console.error("Erro ao carregar medições:", error));
  }

  function groupByDiaenvio(medicoes) {
    return medicoes.reduce((groups, medicao) => {
      const day = medicao.diaenvio;
      if (!groups[day]) {
        groups[day] = [];
      }
      groups[day].push(medicao);
      return groups;
    }, {});
  }

  function renderMenu(groupedData) {
    menu.innerHTML = "";
    Object.keys(groupedData).forEach((day) => {
      const dayGroup = document.createElement("div");
      dayGroup.className = "day-group";
      dayGroup.innerHTML = `<h3 styles="cursor: pointer;" title="Dia do mês de vencimento dos contratos." >Dia ${day}</h3>`;

      const ul = document.createElement("ul");
      groupedData[day].forEach((medicao) => {
        const li = document.createElement("li");

        // Criando o link do item
        const a = document.createElement("a");
        a.href = "#";
        a.textContent = medicao.nome;
        a.addEventListener("click", function (event) {
          event.preventDefault();
          renderMedicao(medicao);
        });

        // Aplica uma classe ao link com base no status de ctr1
        if (medicao.status1 === "Pendente") {
          a.classList.add("status-pendente");
        } else if (medicao.status1 === "Aguardando NF") {
          a.classList.add("status-aguardando");
        } else if (medicao.status1 === "NF Enviada") {
          a.classList.add("status-enviada");
        }

        // Criando o botão "X" (inicialmente oculto)
        const closeButton = document.createElement("button");
        closeButton.textContent = "X";
        closeButton.id = "x";
        closeButton.style.display = "none"; // Escondido por padrão

        closeButton.addEventListener("click", function (event) {
          event.stopPropagation(); // Impede a propagação do clique
          confirmarExclusao(medicao.id); // Passa o item e medicao.id
          console.log(medicao.id);
        });

        // Adicionando eventos para exibir/esconder o botão "X"
        li.addEventListener("mouseenter", function () {
          closeButton.style.display = "inline"; // Exibe o botão ao passar o mouse
        });

        li.addEventListener("mouseleave", function () {
          closeButton.style.display = "none"; // Esconde o botão ao sair do item
        });

        // Adicionando elementos à estrutura
        li.appendChild(a);
        li.appendChild(closeButton);
        ul.appendChild(li);
      });

      dayGroup.appendChild(ul);
      menu.appendChild(dayGroup);
    });
  }

  checkAndResetStatus();

  function confirmarExclusao(medicaoId) {
    const modal = document.getElementById("mensagemModal");
    const btnConfirmar = document.getElementById("btnConfirmarComando");
    const btnCancelar = document.getElementById("btnCancelarComando");

    // Exibir o modal de confirmação
    modal.style.display = "block";

    // Ação de confirmar a exclusão
    btnConfirmar.onclick = function () {
      showLoadingModal();
      // Enviar a solicitação para o servidor para marcar a medição como deletada
      fetch("server.php", {
        method: "POST", // Enviar como POST
        headers: {
          "Content-Type": "application/x-www-form-urlencoded", // Formato esperado pelo PHP
        },
        body: `action=deleteMedicao&id=${medicaoId}`, // Passando o ID da medição como parte do corpo
      })
        .then((response) => {
          if (!response.ok) {
            // Se a resposta não for 2xx (sucesso), dispara um erro
            throw new Error(`Erro na exclusão: ${response.statusText}`);
          }
          return response.json(); // Converte a resposta em JSON se estiver ok
        })
        .then((data) => {
          if (data.success) {
            // Se a resposta for bem-sucedida, removemos o item da interface
            alert("Item excluído com sucesso.");
          } else {
            alert("Bloco de contratos excluído com sucesso!");
            hideLoadingModal();
            loadMedicoes();
          }
        })
        .catch((error) => {
          console.error("Erro ao realizar exclusão:", error);
          alert("Bloco de contratos excluído com sucesso!");
          hideLoadingModal();
          loadMedicoes();
        });

      // Fechar o modal
      modal.style.display = "none";
    };

    // Ação de cancelar a exclusão
    btnCancelar.onclick = function () {
      // Fechar o modal sem excluir
      modal.style.display = "none";
    };

    // Fechar o modal quando o X for clicado
    const closeModal = document.querySelector(".close");
    closeModal.onclick = function () {
      modal.style.display = "none";
    };
  }

  document.addEventListener("click", function (event) {
    if (event.target.classList.contains("atualizar-btn")) {
      showLoadingModal();
      const medicaoId = event.target.dataset.medicaoId;

      console.log("Enviando medicaoId:", medicaoId); // 👀 Depuração

      if (!medicaoId) {
        console.error("Erro: medicaoId está indefinido!");
        return;
      }

      fetch("server.php?action=updatePedidos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ medicaoId }),
      })
        .then((response) => response.text()) // ⚠️ Primeiro, veja a resposta como texto
        .then((text) => {
          console.log("Resposta bruta do servidor:", text); // 👀 Ver o que está vindo
          //return JSON.parse(text); // Agora, tente converter para JSON
        })
        .then((data) => {
          console.log("JSON recebido:", data);
          hideLoadingModal();
          window.location.reload();
        })
        .catch((error) => console.error("Erro ao atualizar pedidos:", error));
    }
  });

  function copiarValor(ctr, medicao) {
    let valor;

    switch (ctr) {
      case "ctr1":
        valor = medicao.ctr1;
        break;
      case "ctr2":
        valor = medicao.ctr2;
        break;
      case "ctr3":
        valor = medicao.ctr3;
        break;
      case "ctr4":
        valor = medicao.ctr4;
        break;
      default:
        valor = "";
        break;
    }

    // Se valor estiver indefinido ou nulo
    if (valor === undefined || valor === null) {
      console.error("Valor não encontrado para o ctr:", ctr);
      alert("Ctr inválido!");
      return;
    }

    const texto = ctr;

    const inputTemp = document.createElement("input");
    inputTemp.value = texto;
    document.body.appendChild(inputTemp);

    // Selecionando o valor do input
    inputTemp.select();
    inputTemp.setSelectionRange(0, 99999); // Para dispositivos móveis

    // Copiar o conteúdo para a área de transferência
    try {
      document.execCommand("copy");
      console.log(`Ctr ${texto} copiado para a área de transferência!`);
    } catch (err) {
      console.error("Erro ao copiar para a área de transferência:", err);
      alert("Erro ao copiar o ctr. Tente novamente.");
    }

    // Remover o campo de input temporário
    document.body.removeChild(inputTemp);
  }

  function adicionarEventosDeCopiar(medicao) {
    // Selecione todos os botões de cópia
    const botoesCopiar = document.querySelectorAll(".copy-btn");

    botoesCopiar.forEach((botao) => {
      botao.addEventListener("click", function () {
        const ctr = this.getAttribute("data-ctr");
        copiarValor(ctr, medicao); // Passando o objeto medicao como argumento
      });
    });
  }

  function atualizarEnviado(medicaoId) {
    showLoadingModal();
    console.log("Enviando medicaoId:", medicaoId); // 👀 Depuração

    if (!medicaoId) {
      console.error("Erro: medicaoId está indefinido!");
      return;
    }

    fetch("server.php?action=atualizarEnviado", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `medicaoId=${encodeURIComponent(medicaoId)}`,
    })
      .then((response) => response.text()) // Primeiro, pega a resposta como texto
      .then((text) => {
        console.log("Resposta bruta do servidor:", text); // 👀 Ver o que está vindo

        try {
          return JSON.parse(text); // Tentar converter para JSON
        } catch (error) {
          throw (new hideLoadingModal(), window.location.reload());
        }
      })
      .then((data) => {
        console.log("JSON recebido:", data);
      })
      .catch((error) => console.error("Erro ao atualizar enviado:", error));
  }

  document.addEventListener("click", function (event) {
    if (event.target.classList.contains("atualizar-env")) {
      const medicaoId = event.target.dataset.medicaoId;
      atualizarEnviado(medicaoId);
    }
  });

  function renderMedicao(medicao) {
    const content = document.getElementById("content");

    let tableHTML = `
    <style>
      table {
          width: 100%;
          margin-top: 10px;
      }
      
      th, td {
          cursor:default;
          padding: 10px 15px;
          border: 1px solid #ccc;
          border-radius: 8px;
      }

      th {
          text-align: center;
          background-color:rgba(244, 244, 244, 0.29);
      }

      td:nth-child(1) {
          width: 10px;
          overflow: hidden;
      }

      td:nth-child(2) {
          width: 200px;
          overflow: hidden;

      }

      td:nth-child(3) {
          text-align: left;
      }

      td:nth-child(4),
      td:nth-child(5),
      td:nth-child(6) {
          width: 200px;
          overflow: hidden;

      }
          
      td:nth-child(7) {
        width: 1px;
        overflow: hidden;
      }

      td{
          border: none;
      }

      .checkmark {
          color: green;
          font-size: 1.2em;
          font-weight: bold;
      }

      select {
        -webkit-appearance: none;  /* Remove o estilo nativo */
        -moz-appearance: none;
        appearance: none;
        background-color:rgba(244, 244, 244, 0.29);
        padding: 10px 30px 10px 10px; 
        font-size: 16px;
        border-radius: 5px;
        border: 1px solid rgba(255, 255, 255, 0.5);
        color:rgb(255, 255, 255) ;
        cursor: pointer;
        text-shadow: black 0.1em 0.1em 0.2em;
        background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="16" viewBox="0 0 10 8"><polygon points="0,0 5,7 10,0" fill="white" /></svg>');
        background-repeat: no-repeat;
        background-position: right 10px center; /* Ajuste a posição conforme necessário */
      }

      option {
        padding: 10px;
        font-size: 16px;
        border-radius: 8px;
      }

      .pendente{
        background-color:rgba(247, 51, 51, 0.767);
        color: white;
      }

      .aguardando{
        background-color:rgba(190, 156, 3, 0.849);
        color: black;
      }

      .enviada{
        background-color: rgba(26, 155, 26, 0.6);
        color: white;
      }

      .ger-buttons {
        position: fixed;
        bottom: 0;
        right: 0;
        margin: 30px;
      }

      .notify-button {
        position: fixed;
        top: 0;
        right: 0;
        margin: 30px;
        cursor: pointer;
      }
        
    </style>

    <h2 title="Fornecedor do(s) contrato(s)." id="title">${
      medicao.nome
    } </h2>   
    <div style="cursor: pointer;" class="notify-button">
      <input type="checkbox" id="notify" title="Ativar/Desativar notificações via e-mail sobre está medição." name="notify" ${
        medicao.notify == 1 ? "checked" : ""
      } onchange="toggleNotify(${medicao.id}, this.checked)" />
      <label for="notify" title="Ativar/Desativar notificações via e-mail sobre esta medição.">
      Notificações 
      ${
        medicao.notify == 1
          ? '<i class="fa-regular fa-bell"></i>'
          : '<i class="fa-regular fa-bell-slash"></i>'
      }
      </label>
    </div>

    
    <div>   
      <h3 title="Selecione o status da medição para esse fornecdor." style="display: inline; margin: 5px;">Status</h3>
      <select class="status-select" data-id="${
        medicao.id
      }" onchange="updateStatus(this, 'status1')">
        <option title="Pendente de realizar a medição dos contratos." class="pendente" value="Pendente" ${
          medicao.status1 === "Pendente" ? "selected" : ""
        }>Pendente</option>
        <option title="Medição realizada, aguardando a nota fiscal pelo fornecedor." class="aguardando" value="Aguardando NF" ${
          medicao.status1 === "Aguardando NF" ? "selected" : ""
        }>Aguardando NF</option>
        <option title="Nota fiscal enviada para classificação." class="enviada" value="NF Enviada" ${
          medicao.status1 === "NF Enviada" ? "selected" : ""
        }>NF Enviada</option>
      </select>
      <br>

    </div>
          
    <table>
      <thead>
        <tr>
          <th title="Filial do contrato no sistema Protheus.">Filial</th>
          <th title="Número do contrato no sistema Protheus.">Contrato</th>     
          <th title="Descrição do contrato.">Descrição</th>  
          <th title="Valor Estimado/Previsto do Contrato.">Valor</th>
          <th title="Valor do último pedido de compras do contrato no sistema Protheus.">Valor Último Pedido</th>
          <th title="Último número de pedido de compras do contrato no sistema Protheus.">Nº Último Pedido</th>
          <th title="Último número de pedido de compras já foi enviado ao Fornecedor.">Enviado</th>
        </tr>
      </thead>
      <tbody>`;

    const linhas = [
      {
        filial: medicao.filial1,
        ctr: medicao.ctr1,
        desc: medicao.desc1,
        valor: medicao.valor1,
        ultvalor: medicao.ultvalor1,
        ultped: medicao.ultped1,
        pedenv: medicao.pedenv1,
      },
      {
        filial: medicao.filial2,
        ctr: medicao.ctr2,
        desc: medicao.desc2,
        valor: medicao.valor2,
        ultvalor: medicao.ultvalor2,
        ultped: medicao.ultped2,
        pedenv: medicao.pedenv2,
      },
      {
        filial: medicao.filial3,
        ctr: medicao.ctr3,
        desc: medicao.desc3,
        valor: medicao.valor3,
        ultvalor: medicao.ultvalor3,
        ultped: medicao.ultped3,
        pedenv: medicao.pedenv3,
      },
      {
        filial: medicao.filial4,
        ctr: medicao.ctr4,
        desc: medicao.desc4,
        valor: medicao.valor4,
        ultvalor: medicao.ultvalor4,
        ultped: medicao.ultped4,
        pedenv: medicao.pedenv4,
      },
    ];

    linhas.forEach((linha) => {
      if (linha.ctr) {
        tableHTML += `
        <tr 
          data-contrato="${linha.ctr}"
          data-descricao="${linha.desc}"
          data-valor="${linha.valor}"
          data-pedido="${linha.ultped}"
          data-filial="${linha.filial}"
        >
          <td>${linha.filial}</td>
          <td>${linha.ctr} <button class="copy-btn" data-ctr="${
          linha.ctr
        }"><i class="fa-regular fa-copy"></i></button></td>
          <td>${linha.desc}</td>
          <td>R$ ${linha.valor}</td>
          <td>R$ ${linha.ultvalor}</td>
          <td>${linha.ultped}</td>
          <td>${
            linha.pedenv === linha.ultped
              ? "<span class='checkmark'>&#10003;</span>"
              : "<span></span>"
          }</td>
        </tr>`;
      }
    });

    tableHTML += `
      </tbody>
    </table>
    <link rel="stylesheet" href="./fontawesome/css/all.css" />
    <link rel="stylesheet" href="./fontawesome/css/v4-shims.css" />
    <div class="ger-buttons">

      <button id="gravar-btn" title="Gravar informações desta medição na nota fiscal (PDF)."><i class="fa fa-save" aria-hidden="true"></i> Gravar</button>


      <button class='atualizar-btn' data-medicao-id="${medicao.id}" title="Atualizar pedidos de compras."><i class="fa fa-refresh" aria-hidden="true"></i>  Pedidos</button>
      <button  data-medicao-id="${medicao.id}" id="wtsappico" title="Enviar mensagem ao fornecedor via Whatsapp." onclick="sendMessage('${medicao.nome}', ${medicao.id})"></button>
      <button  data-medicao-id="${medicao.id}" id="msgico" title="Enviar mensagem ao fornecedor via Email." onclick="sendEmailMessage('${medicao.nome}', ${medicao.id})"></button>
      <button class='atualizar-env' data-medicao-id="${medicao.id}" title="Marcar como enviado, marque caso já tenha enviado o último pedido ao fornecedor."></button>

    </div>
  `;

    content.innerHTML = tableHTML;

    initGravarModal();
    adicionarEventosDeCopiar();
  }
  function initGravarModal() {
    const gravarBtn = document.getElementById("gravar-btn");
    const modal = document.getElementById("gravar-modal");

    if (!gravarBtn || !modal) {
      console.warn("Elementos de gravação não encontrados!");
      return;
    }

    gravarBtn.addEventListener("click", () => {
      modal.style.display = "flex";

      // Coleta os contratos para exibir no modal
      const linhas = document.querySelectorAll("tbody tr");
      const contratos = {};

      linhas.forEach((linha) => {
        const contrato = linha.dataset.contrato;
        const descricao = linha.dataset.descricao;
        const valor = linha.dataset.valor;
        const filial = linha.dataset.filial;
        const pedido = linha.dataset.pedido;

        if (contrato && !contratos[contrato]) {
          contratos[contrato] = { descricao, valor, pedido, filial };
        }
      });

      renderizaCheckboxContratos(contratos);
    });
  }

  function renderizaCheckboxContratos(contratos) {
    const container = document.getElementById("contratoSelector");
    container.innerHTML = "<h3>Selecione o contrato para o PDF:</h3>";

    Object.entries(contratos).forEach(([numero, dados]) => {
      const div = document.createElement("div");
      div.style.textAlign = "left";
      div.style.marginLeft = "6rem";

      div.innerHTML = `
        <label style="cursor: pointer; display: block;">
          <input type="radio" name="contrato" value="${numero}" style="margin-right: 10px;">
          <strong>${numero}</strong> - ${dados.descricao}
        </label>
        <br><br>
      `;
      container.appendChild(div);
    });

    // Campos adicionais opcionais
    const formPgmtInput = document.createElement("input");
    formPgmtInput.type = "text";
    formPgmtInput.placeholder = "Form. Pgmt (opcional)";
    formPgmtInput.id = "formPgmtInput";
    formPgmtInput.style.marginBottom = "8px";
    formPgmtInput.style.borderRadius = "4px";
    container.appendChild(formPgmtInput);
    container.appendChild(document.createElement("br"));

    const vencInput = document.createElement("input");
    vencInput.type = "text";
    vencInput.placeholder = "Venc. (opcional)";
    vencInput.id = "vencInput";
    vencInput.style.marginBottom = "16px";
    vencInput.style.borderRadius = "4px";
    container.appendChild(vencInput);
    container.appendChild(document.createElement("br"));

    const botaoConfirmar = document.createElement("button");
    botaoConfirmar.textContent = "Confirmar e Gerar PDF";

    botaoConfirmar.addEventListener("click", () => {
      const selecionados = [];

      const checkboxes = container.querySelectorAll(
        "input[name='contrato']:checked"
      );

      checkboxes.forEach((checkbox) => {
        const numeroContrato = checkbox.value;
        const dados = contratos[numeroContrato];

        if (dados) {
          selecionados.push({
            numero: numeroContrato,
            descricao: dados.descricao,
            valor: dados.valor,
            pedido: dados.pedido,
            filial: dados.filial,
          });
        }
      });

      const formPgmt = formPgmtInput.value.trim();
      const vencimento = vencInput.value.trim();

      if (Array.isArray(selecionados)) {
        gerarPDFSelecionado(selecionados, formPgmt, vencimento);
      } else {
        alert("Erro: os dados selecionados não estão no formato correto.");
      }
    });

    container.appendChild(botaoConfirmar);

    const botaoCancelar = document.createElement("button");
    botaoCancelar.textContent = "Cancelar";
    botaoCancelar.style.marginLeft = "10px";

    botaoCancelar.addEventListener("click", () => {
      document.getElementById("gravar-modal").style.display = "none";
      const input = document.getElementById("pdf-upload");
      if (input) input.value = "";
      container.innerHTML = "";
    });

    container.appendChild(botaoCancelar);
  }

  async function gerarPDFSelecionado(
    contratosSelecionados,
    formPgmt = "",
    vencimento = ""
  ) {
    const input = document.getElementById("pdf-upload");

    if (!input.files || input.files.length === 0) {
      alert("Por favor, selecione um arquivo PDF para gravar.");
      return;
    }

    const file = input.files[0];

    try {
      const existingPdfBytes = await file.arrayBuffer();
      const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      const { width, height } = firstPage.getSize();
      const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

      const proporcao = height / 800;
      const fontSize = Math.min(Math.max(6, 10 * proporcao), 16);
      const lineHeight = fontSize + 4;

      const textColor = PDFLib.rgb(1, 0, 0);
      let y = 20;

      contratosSelecionados.forEach((contrato) => {
        const bloco = [];

        // Adiciona as informações opcionais no topo
        if (vencimento) bloco.push(`Venc.: ${vencimento}`);
        if (formPgmt) bloco.push(`Form. Pgmt: ${formPgmt}`);

        bloco.push(`Valor: ${contrato.valor}`);
        bloco.push(
          `Pedido: ${contrato.pedido !== "null" ? contrato.pedido : "N/A"}`
        );
        bloco.push(`Descrição: ${contrato.descricao}`);
        bloco.push(`Ctr: ${contrato.numero} - ${contrato.filial}`);

        bloco.forEach((linha) => {
          firstPage.drawText(linha, {
            x: 20,
            y: y,
            size: fontSize,
            font: font,
            color: textColor,
          });
          y += lineHeight;
        });

        y += lineHeight;
      });

      const pdfBytes = await pdfDoc.save();

      const nomeOriginal = file.name.replace(/\.pdf$/i, "");
      const nomeFinal = `${nomeOriginal}_${contratosSelecionados[0].filial.replace(
        /\W+/g,
        "_"
      )}_${contratosSelecionados[0].pedido.replace(/\W+/g, "_")}.pdf`;

      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = nomeFinal;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao gravar no PDF:", err);
      alert("Erro ao gerar PDF. Verifique o arquivo e tente novamente.");
    }
  }

  window.toggleNotify = function (medicaoId, isChecked) {
    showLoadingModal();
    const action = isChecked ? "activenotify" : "desactivenotify";

    fetch("server.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `action=${action}&id=${medicaoId}`,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          console.log(data.success);
        } else {
          alert(
            "Erro ao atualizar notificação: " +
              (data.error || "Erro desconhecido")
          );
        }
      })
      .catch((error) => {
        console.error("Erro ao atualizar notificação:", error);
        hideLoadingModal();
        loadMedicoes();
      });
  };

  window.updateStatus = function (selectElement, statusField) {
    const id = selectElement.dataset.id;
    const status = selectElement.value;

    fetch("server.php?action=updateMedicao", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, statusField, status }),
    })
      .then((response) => response.text()) // Use .text() para capturar a resposta como texto
      .then((data) => {
        console.log("Resposta do servidor:", data); // Log da resposta do servidor

        // Tente analisar o JSON da resposta
        try {
          const jsonData = JSON.parse(data);
          if (jsonData.success) {
            console.log(
              "Status atualizado com sucesso! Recarregando a página..."
            );
            loadMedicoes();
          } else {
            alert(
              "Erro ao atualizar o status: " +
                (jsonData.error || "Erro desconhecido")
            );
          }
        } catch (error) {
          console.error("Erro ao analisar JSON:", error);
          alert("Erro inesperado: " + data);
        }
      })
      .catch((error) => {
        console.error("Erro ao atualizar status:", error);
        alert(
          "Erro ao tentar atualizar o status. Verifique a conexão e tente novamente."
        );
      });
  };

  window.sendMessage = function (section, medicaoId) {
    console.log(
      `Tentando gerar mensagem para seção: ${section}, Medicao ID: ${medicaoId}`
    );

    // Obtenha o contato da medição
    fetch(`server.php?action=getMedicaoCtt&id=${medicaoId}`)
      .then((response) => response.json())
      .then((data) => {
        console.log("Dados de contato recebidos:", data);

        if (data.ctt) {
          const months = [
            "Janeiro",
            "Fevereiro",
            "Março",
            "Abril",
            "Maio",
            "Junho",
            "Julho",
            "Agosto",
            "Setembro",
            "Outubro",
            "Novembro",
            "Dezembro",
          ];
          const today = new Date();
          const monthName = months[today.getMonth()];
          const phoneNumber = data.ctt;
          let message = `Segue dados para faturamento *${section}* - Mês: ${monthName}\n\n`;
          let hasPedidos = false;

          // Obtenha os detalhes da medição específica
          fetch(`server.php?action=listMedicoes&id=${medicaoId}`)
            .then((response) => response.json())
            .then((medicoes) => {
              console.log("Medições recebidas:", medicoes);

              // Comparação garantindo que ambos são números
              const medicao = medicoes.find(
                (m) => Number(m.id) === Number(medicaoId)
              );

              if (!medicao) {
                console.error("Medição não encontrada");
                alert("Medição não encontrada.");
                return;
              }

              // Lógica para construir a mensagem com pedidos...
              if (medicao.ctr1) {
                const pedido1 = medicao.ultped1;

                message += `Contrato: ${medicao.ctr1} - ${medicao.desc1} - Pedido: *${pedido1}* - Valor: R$ ${medicao.valor1}\n`;
                hasPedidos = true;
              }

              if (medicao.ctr2) {
                const pedido2 = medicao.ultped2;

                message += `Contrato: ${medicao.ctr2} - ${medicao.desc2} - Pedido: *${pedido2}* - Valor: R$ ${medicao.valor2}\n`;
                hasPedidos = true;
              }

              if (medicao.ctr3) {
                const pedido3 = medicao.ultped3;

                message += `Contrato: ${medicao.ctr3} - ${medicao.desc3} - Pedido: *${pedido3}* - Valor: R$ ${medicao.valor3}\n`;
                hasPedidos = true;
              }

              if (medicao.ctr4) {
                const pedido4 = medicao.ultped4;

                message += `Contrato: ${medicao.ctr4} - ${medicao.desc4} - Pedido: *${pedido4}* - Valor: R$ ${medicao.valor4}\n`;
                hasPedidos = true;
              }

              message += `\n_Aguardamos o envio da(s) nota(s) fiscal(s) referenciando o(s) nosso(s) pedido(s) de compras._\n`;

              if (hasPedidos) {
                const whatsappMessage = encodeURIComponent(message);
                const whatsappUrl = `https://wa.me/${phoneNumber}?text=${whatsappMessage}`;
                window.open(whatsappUrl, "_blank");
                loadMedicoes();
              } else {
                alert("Nenhum pedido foi inserido. Operação cancelada.");
              }
            })
            .catch((error) =>
              console.error("Erro ao carregar dados da medição:", error)
            );
        } else {
          alert("Contato não configurado para essa medição.");
        }
      })
      .catch((error) =>
        console.error("Erro ao obter contato da medição:", error)
      );
  };

  loadMedicoes();
});

window.sendEmailMessage = function (section, medicaoId) {
  console.log(
    `Tentando gerar mensagem para seção: ${section}, Medicao ID: ${medicaoId}`
  );

  // Obtenha o contato da medição
  fetch(`server.php?action=getMedicaoCtt&id=${medicaoId}`)
    .then((response) => response.json())
    .then((data) => {
      console.log("Dados de contato recebidos:", data);

      // Verifique se o email está presente (não considerando o ctt)
      if (data.email) {
        const email = data.email;
        let message = `Segue dados para faturamento ${section}:\n\n`;
        let hasPedidos = false;

        // Obtenha os detalhes da medição específica
        fetch(`server.php?action=listMedicoes&id=${medicaoId}`)
          .then((response) => response.json())
          .then((medicoes) => {
            console.log("Medições recebidas:", medicoes);

            // Comparação garantindo que ambos são números
            const medicao = medicoes.find(
              (m) => Number(m.id) === Number(medicaoId)
            );

            if (!medicao) {
              console.error("Medição não encontrada");
              alert("Medição não encontrada.");
              return;
            }

            // Lógica para construir a mensagem com pedidos...
            if (medicao.ctr1) {
              const pedido1 = medicao.ultped1;
              message += `Contrato: ${medicao.ctr1} - ${medicao.desc1} - Pedido: ${pedido1} - Valor: R$ ${medicao.valor1}\n`;
              hasPedidos = true;
            }

            if (medicao.ctr2) {
              const pedido2 = medicao.ultped2;
              message += `Contrato: ${medicao.ctr2} - ${medicao.desc2} - Pedido: ${pedido2} - Valor: R$ ${medicao.valor2}\n`;
              hasPedidos = true;
            }

            if (medicao.ctr3) {
              const pedido3 = medicao.ultped3;
              message += `Contrato: ${medicao.ctr3} - ${medicao.desc3} - Pedido: ${pedido3} - Valor: R$ ${medicao.valor3}\n`;
              hasPedidos = true;
            }

            if (medicao.ctr4) {
              const pedido4 = medicao.ultped4;
              message += `Contrato: ${medicao.ctr4} - ${medicao.desc4} - Pedido: ${pedido4} - Valor: R$ ${medicao.valor4}\n`;
              hasPedidos = true;
            }

            message += `\nAguardamos o envio da(s) nota(s) fiscal(s) referenciando o(s) nosso(s) pedido(s) de compras.\n`;

            if (hasPedidos) {
              // Obtenha o mês vigente para colocar no subject
              const months = [
                "Janeiro",
                "Fevereiro",
                "Março",
                "Abril",
                "Maio",
                "Junho",
                "Julho",
                "Agosto",
                "Setembro",
                "Outubro",
                "Novembro",
                "Dezembro",
              ];
              const today = new Date();
              const monthName = months[today.getMonth()];

              // Monta o assunto com o mês atual
              const emailSubject = encodeURIComponent(
                `Dados de faturamento - Fornecedor: ${section} - Mês: ${
                  today.getMonth() + 1
                } - ${monthName}`
              );
              const emailBody = encodeURIComponent(message);
              const mailtoLink = `mailto:${email}?subject=${emailSubject}&body=${emailBody}`;

              // Tente abrir o cliente de e-mail
              window.location.href = mailtoLink;

              // Mensagem informando que o processo foi iniciado
              alert(
                "O e-mail foi aberto no seu cliente de e-mail. Por favor, revise antes de enviar."
              );
            } else {
              alert("Nenhum pedido foi inserido. Operação cancelada.");
            }
          })
          .catch((error) => {
            console.error("Erro ao carregar dados da medição:", error);
            alert("Erro ao carregar dados da medição.");
          });
      } else {
        alert("Email não configurado para essa medição.");
      }
    })
    .catch((error) => {
      console.error("Erro ao obter contato da medição:", error);
      alert("Erro ao obter o contato da medição.");
    });
};

function displayCurrentMonth() {
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const today = new Date();
  const monthName = months[today.getMonth()];
  const year = today.getFullYear();

  document.getElementById("current-month").textContent = `${
    today.getMonth() + 1
  } - ${monthName}`;
  console.log(monthName);
}

document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("modalMedicao");
  const btnAdd = document.getElementById("addBUTT");
  const btnClose = document.querySelector(".close");
  const btnSalvar = document.getElementById("salvarMedicao");
  const btnAddContrato = document.getElementById("addContrato");
  const extraContratos = document.getElementById("extraContratos");

  // Captura o username do input oculto
  const username = document.getElementById("username").value;

  let contratoCount = 1;

  function ocultarContratosExtras() {
    extraContratos.querySelectorAll("div").forEach((div, index) => {
      if (index >= 1) div.style.display = "none";
    });
  }

  function exibirContratosExtras() {
    extraContratos.querySelectorAll("div").forEach((div, index) => {
      if (index >= 1 && index < contratoCount) div.style.display = "block";
    });
  }

  // Abre e fecha o modal
  btnAdd.onclick = function () {
    modal.style.display = "block";
  };

  btnClose.onclick = function () {
    modal.style.display = "none";
    location.reload();
  };

  // Validação do campo "Dia de Vencimento"
  document.getElementById("diaenvio").addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, ""); // Remove não numéricos
    if (value > 31) value = 31;
    if (value < 1 && value !== "") value = 1;
    e.target.value = value;
  });

  // Função para formatar o contrato com 15 dígitos (números, zeros à esquerda)
  function formatarContrato(input) {
    let numero = input.value.replace(/\D/g, ""); // Remove caracteres não numéricos
    numero = numero.padStart(15, "0"); // Preenche com zeros à esquerda
    input.value = numero.slice(-15); // Mantém apenas os últimos 15 dígitos
  }

  // Aplica a formatação no campo do contrato 1 (que já existe)
  const ctr1 = document.getElementById("ctr1");
  if (ctr1) {
    ctr1.addEventListener("input", function (e) {
      formatarContrato(e.target);
    });
  }

  // Função para formatar o valor no padrão numérico com limite de 10 caracteres
  function formatarValor(input) {
    let value = input.value.replace(/\D/g, ""); // Remove tudo que não for número
    if (value.length > 10) {
      value = value.slice(0, 10); // Garante que tenha no máximo 10 caracteres
    }

    // Converte para número com duas casas decimais
    let inteiro = value.slice(0, -2) || "0"; // Parte inteira
    let decimal = value.slice(-2).padStart(2, "0"); // Últimos dois dígitos como decimal, garantindo pelo menos 2 casas

    input.value = `${parseInt(inteiro)}.${decimal}`;
  }

  // Aplica a formatação para todos os campos de valor existentes ao carregar a página
  document.querySelectorAll("[id^='valor']").forEach((campo) => {
    campo.addEventListener("input", function (e) {
      formatarValor(e.target);
    });
  });

  // Função para limitar o telefone a 11 dígitos (somente números)
  function limitarTelefone(input) {
    let numero = input.value.replace(/\D/g, "");
    if (numero.length > 11) {
      numero = numero.slice(0, 11);
    }
    input.value = numero;
  }

  // Evento para limitar o campo de telefone ("ctt")
  const ctt = document.getElementById("ctt");
  if (ctt) {
    ctt.addEventListener("input", function (e) {
      limitarTelefone(e.target);
    });
  }

  // Função para converter o telefone para o formato internacional (+55XXXXXXXXXXX)
  function formatarTelefoneEnvio(numeroStr) {
    let numeros = numeroStr.replace(/\D/g, "");
    // Se tiver 10 ou 11 dígitos, retorna no formato esperado
    if (numeros.length === 10 || numeros.length === 11) {
      return `+55${numeros}`;
    } else {
      return "+5562996005956";
    }
  }

  // Ao adicionar um novo contrato, criamos os elementos e adicionamos os event listeners
  btnAddContrato.onclick = function () {
    if (contratoCount >= 4) {
      alert("Máximo de 4 contratos atingido!");
      return;
    }
    contratoCount++;

    const contratoDiv = document.createElement("div");
    contratoDiv.innerHTML = `
      <h3>Contrato ${contratoCount}</h3>
      <label>Filial*: 
        <select class="filiais" id="filial${contratoCount}" maxlength="6" required>
          <option value="010101">010101 - Matriz</option>
          <option value="010102">010102 - Filial</option>
          <option value="030101">030101 - Mineração</option>
          <option value="050101">050101 - MJ</option>
        </select>
      </label> 
      <label>Nº Contrato*: <input type="text" id="ctr${contratoCount}" required></label>
      <label>Descrição*: <input type="text" id="desc${contratoCount}" required></label>
      <label>Valor R$*: <input type="text" id="valor${contratoCount}" required></label>
    `;
    extraContratos.appendChild(contratoDiv);
    exibirContratosExtras();

    // Adiciona o event listener para formatar o contrato do novo campo
    const novoCtr = document.getElementById(`ctr${contratoCount}`);
    if (novoCtr) {
      novoCtr.addEventListener("input", function (e) {
        formatarContrato(e.target);
      });
    }

    // Adiciona o event listener para formatar o valor do novo campo em tempo real
    const novoValor = document.getElementById(`valor${contratoCount}`);
    if (novoValor) {
      novoValor.addEventListener("input", function (e) {
        formatarValor(e.target);
      });
    }
  };

  // Ao salvar, coletamos os dados e validamos
  btnSalvar.onclick = function () {
    const nome = document.getElementById("nome").value.trim();
    const diaenvio = document.getElementById("diaenvio").value.trim();
    const telefoneInput = document.getElementById("ctt").value.trim();
    const emailforn = document.getElementById("emailforn").value.trim();
    const cttFormatado = formatarTelefoneEnvio(telefoneInput);
    const ctr1Val = document.getElementById("ctr1").value.trim();
    const desc1 = document.getElementById("desc1").value.trim();
    const filial1 = document.getElementById("filial1").value.trim();
    let valor1Val = document.getElementById("valor1").value.trim();

    // Formata o valor e garante que os campos obrigatórios estejam preenchidos
    formatarValor(document.getElementById("valor1"));
    if (!nome || !diaenvio || !ctr1Val || !desc1 || !filial1 || !valor1Val) {
      alert("Por favor, preencha todos os campos obrigatórios!");
      return;
    }

    if (parseInt(diaenvio) < 1 || parseInt(diaenvio) > 31) {
      alert("O dia de vencimento deve estar entre 1 e 31.");
      return;
    }

    const dados = {
      username: username,
      nome: nome,
      diaenvio: diaenvio,
      ctt: cttFormatado,
      emailforn: emailforn,
      last_reset: new Date().toISOString().split("T")[0],
      ctr1: ctr1Val,
      desc1: desc1,
      filial1: filial1,
      valor1: valor1Val,
    };

    // Para contratos adicionais
    for (let i = 2; i <= contratoCount; i++) {
      const ctr = document.getElementById(`ctr${i}`)?.value.trim() || "";
      const desc = document.getElementById(`desc${i}`)?.value.trim() || "";
      const filial = document.getElementById(`filial${i}`)?.value.trim() || "";
      const valor = document.getElementById(`valor${i}`)?.value.trim() || "";

      if (!ctr || !desc || !filial || !valor) {
        alert(`Por favor, preencha todos os campos do Contrato ${i}!`);
        return;
      }
      dados[`ctr${i}`] = ctr;
      dados[`desc${i}`] = desc;
      dados[`filial${i}`] = filial;
      dados[`valor${i}`] = valor;
    }

    fetch("server.php?action=addMedicao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          alert("Medição adicionada com sucesso!");
          modal.style.display = "none";
          // Opcional: resetar os campos aqui se necessário
          location.reload();
        } else {
          alert("Erro: " + data.error);
        }
      })
      .catch((error) => {
        console.error("Erro ao adicionar medição:", error);
        alert("Erro ao conectar-se com o servidor.");
      });
  };
});
