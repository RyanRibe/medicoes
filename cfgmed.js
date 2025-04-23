document.addEventListener("DOMContentLoaded", function () {
  const configForm = document.getElementById("config-form");
  const configList = document.getElementById("config-list");
  const addButton = document.getElementById("add-button");

  function loadMedicoes() {
    fetch('server.php?action=listMedicoes')
      .then(response => response.json())
      .then(data => {
        renderConfigList(data);
      })
      .catch(error => console.error('Erro ao carregar medições:', error));
  }

  function renderConfigList(medicoes) {
    configList.innerHTML = "";
    medicoes.forEach(medicao => {
        const li = document.createElement("li");
        li.innerHTML = `
            <label>Nome:
                <input type="text" value="${medicao.nome}" data-id="${medicao.id}" class="medicao-nome" />
            </label>
            <label>Contato:
                <input type="text" value="${medicao.ctt || ''}" data-id="${medicao.id}" class="medicao-ctt" placeholder="ex: +5511999999999" />
            </label>
            <label>Email:
                <input type="text" value="${medicao.email || ''}" data-id="${medicao.id}" class="medicao-email" placeholder="" />
            </label>
            <button type="button" class="remove-button">Remover</button>
        `;
        configList.appendChild(li);
    });
}

function saveConfig() {
  const inputs = configList.querySelectorAll("li");
  inputs.forEach(li => {
      const id = li.querySelector(".medicao-nome").dataset.id;
      const nome = li.querySelector(".medicao-nome").value;
      const ctt = li.querySelector(".medicao-ctt").value;
      const email = li.querySelector(".medicao-email").value;


      fetch('server.php?action=updateMedicao', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id, nome, ctt, email })  // Certifique-se de que o campo 'ctt' está sendo enviado
      })
      .then(response => response.json())
      .then(data => {
          if (!data.success) {
              alert('Erro ao salvar configuração');
          }
      })
      .catch(error => console.error('Erro ao salvar configuração:', error));
  });
}


  configForm.addEventListener("submit", function (event) {
    event.preventDefault();
    saveConfig();
    alert("Configurações salvas com sucesso!");
    window.location.href = "Medicao";
  });

  //addButton.addEventListener("click", function () {
    //const nome = prompt("Nome da nova medição:");
    //const diaenvio = prompt("Dia de realizar a medição:");
    //const ctr1 = prompt("CTR1:");
    //const valor1 = prompt("Valor para CTR1:");
    //const status1 = prompt("Status para CTR1 (Pendente por padrão):") || 'Pendente';

    //const ctr2 = prompt("CTR2 (opcional):") || null;
    //const valor2 = ctr2 ? prompt("Valor para CTR2 (opcional):") : null;
    //const status2 = ctr2 ? (prompt("Status para CTR2 (Pendente por padrão):") || 'Pendente') : null;

    //const ctr3 = prompt("CTR3 (opcional):") || null;
    //const valor3 = ctr3 ? prompt("Valor para CTR3 (opcional):") : null;
    //const status3 = ctr3 ? (prompt("Status para CTR3 (Pendente por padrão):") || 'Pendente') : null;

    //const ctr4 = prompt("CTR4 (opcional):") || null;
    //const valor4 = ctr4 ? prompt("Valor para CTR4 (opcional):") : null;
    //const status4 = ctr4 ? (prompt("Status para CTR4 (Pendente por padrão):") || 'Pendente') : null;

    //fetch('server.php?action=addMedicao', {
      //method: 'POST',
      //headers: {
        //'Content-Type': 'application/json'
      //},
      //body: JSON.stringify({ nome, diaenvio, ctr1, valor1, status1, ctr2, valor2, status2, ctr3, valor3, status3, ctr4, valor4, status4 })
    //})
      //.then(response => response.json())
      //.then(data => {
        //if (data.success) {
          //loadMedicoes();
        //} else {
         // alert('Erro ao adicionar medição');
        //}
     // })
     // .catch(error => console.error('Erro ao adicionar medição:', error));
 // });

  loadMedicoes();
});
