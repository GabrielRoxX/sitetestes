// Array global para armazenar os alunos
let alunos = [];

// Map de status - EXIGÊNCIA DO PDF: Utilizado obrigatoriamente na listagem
const statusMap = new Map([
  ["APR", "Aprovado"],
  ["REP", "Reprovado por Nota"],
  ["FREQ", "Reprovado por Frequência"]
]);

// Função utilitária para calcular média ponderada
function calcularMediaPonderada(notas, pesos = [1, 1, 1]) {
  let soma = 0;
  let somaPesos = 0;
  for (let i = 0; i < notas.length; i++) {
    soma += notas[i] * pesos[i];
    somaPesos += pesos[i];
  }
  return soma / somaPesos;
}

// Função para determinar conceito
// AJUSTE: Refatorada de switch(true) para avaliar a parte inteira da média (padrão acadêmico clássico)
function conceito(media) {
  const notaInteira = Math.floor(media);

  switch (notaInteira) {
    case 10:
    case 9:
      return "A";
    case 8:
    case 7:
      return "B";
    case 6:
    case 5:
      return "C";
    default:
      return "D";
  }
}

// Função para cadastrar aluno
document.getElementById("formCadastro").addEventListener("submit", function (event) {
  event.preventDefault();
  try {
    const nome = document.getElementById("nome").value.trim();
    const nota1 = Number(document.getElementById("nota1").value);
    const nota2 = Number(document.getElementById("nota2").value);
    const nota3 = Number(document.getElementById("nota3").value);
    const presencas = Number(document.getElementById("presencas").value);
    const aulasTotais = Number(document.getElementById("aulasTotais").value);
    const emailResponsavel = document.getElementById("emailResponsavel")?.value.trim() || null;
    const telefoneResponsavel = document.getElementById("telefone")?.value.trim() || null;

    // Validações básicas (Try/Catch exigido na Aula 8)
    if (!nome) {
      throw new Error("O campo de nome do aluno é obrigatório.");
    }
    if (nota1 < 0 || nota1 > 10 || nota2 < 0 || nota2 > 10 || nota3 < 0 || nota3 > 10) {
      throw new Error("As notas devem estar estritamente entre 0 e 10.");
    }
    if (presencas < 0 || aulasTotais <= 0 || presencas > aulasTotais) {
      throw new Error("O número de presenças não pode ser superior ao total de aulas.");
    }

    // Criando objeto do aluno
    const novoAluno = {
      id: Date.now(),
      nome: nome,
      notas: [nota1, nota2, nota3],
      presencas: presencas,
      aulasTotais: aulasTotais,
    // Removed responsavel property as it's no longer used
    // contato remains for email and telefone
    contato: {
      email: emailResponsavel || null,
      telefone: telefoneResponsavel
    }
    };

    // Adiciona ao array global
    alunos.push(novoAluno);

    // Limpa o formulário
    document.getElementById("formCadastro").reset();
    document.getElementById("mensagemErro").textContent = "";
    document.getElementById("mensagemErro").style.display = "none";

    // Efeito visual de sucesso (Confetes)
    // Trigger confetti only if the student is approved (media >= 7 and freq >= 75)
    const mediaNovo = calcularMediaPonderada(novoAluno.notas);
    const freqNovo = (novoAluno.presencas / novoAluno.aulasTotais) * 100;
    if (mediaNovo >= 7 && freqNovo >= 75) {
      dispararConfetes();
    }

    // Atualiza a listagem
    renderizarTabela();

  } catch (error) {
    const divErro = document.getElementById("mensagemErro");
    divErro.textContent = error.message;
    divErro.style.display = "block";
  }
});

// Função para renderizar tabela
// AJUSTES: Cálculo e exibição da média em tempo real + busca dinâmica no statusMap
function renderizarTabela(filtro = "") {
  const tbody = document.querySelector("#tabelaAlunos tbody");
  tbody.innerHTML = "";

  for (const aluno of alunos) {
    // Filtro de busca por nome
    if (filtro && !aluno.nome.toLowerCase().includes(filtro.toLowerCase())) continue;

    const media = calcularMediaPonderada(aluno.notas);
    const freq = (aluno.presencas / aluno.aulasTotais) * 100;

    // Determinação da chave do statusMap baseado nas regras de negócio
    let statusChave = "";
    if (media >= 7 && freq >= 75) {
      statusChave = "APR";
    } else if (freq < 75) {
      statusChave = "FREQ"; // Reprovação por falta tem prioridade visual
    } else {
      statusChave = "REP";
    }

    // EXIGÊNCIA DO PDF: Busca textual obrigatória através do Map global
    const statusPorExtenso = statusMap.get(statusChave) || "Reprovado";

    const tr = document.createElement("tr");
    const motivo = (() => {
        if (media >= 7 && freq >= 75) {
          return "Aprovado";
        } else if (freq < 75 && media >= 7) {
          return "Reprovado por frequência";
        } else if (media < 7 && freq >= 75) {
          return "Reprovado por notas";
        } else {
          return "Reprovado por notas e frequência";
        }
      })();
      tr.innerHTML = `
        <td>${aluno.nome}</td>
        <td>${media.toFixed(1)}</td>
        <td>${conceito(media)}</td>
        <td>${motivo}</td>
        <td>${freq.toFixed(1)}%</td>
        <td>${aluno.contato.email?.trim() || "E-mail não informado"}</td>
      `;
    tbody.appendChild(tr);
  }

  // Lógica de manipulação das classes de ilustração dinâmica no painel lateral
  const painelIlustracao = document.getElementById("cadastroIlustracao");
  if (painelIlustracao) {
    if (alunos.length > 0) {
      painelIlustracao.classList.add("com-alunos");

      const temAprovadoGeral = alunos.some(aluno => {
        const media = calcularMediaPonderada(aluno.notas);
        const freq = (aluno.presencas / aluno.aulasTotais) * 100;
        return media >= 7 && freq >= 75;
      });

      if (temAprovadoGeral) {
        painelIlustracao.classList.add("com-aprovados");
      } else {
        painelIlustracao.classList.remove("com-aprovados");
      }

      const ultimoAluno = alunos[alunos.length - 1];
      const mediaUltimo = calcularMediaPonderada(ultimoAluno.notas);
      const freqUltimo = (ultimoAluno.presencas / ultimoAluno.aulasTotais) * 100;
      const ultimoAprovado = mediaUltimo >= 7 && freqUltimo >= 75;

      if (!ultimoAprovado) {
        painelIlustracao.classList.add("ultimo-reprovado");
      } else {
        painelIlustracao.classList.remove("ultimo-reprovado");
      }
    } else {
      painelIlustracao.classList.remove("com-alunos", "com-aprovados", "ultimo-reprovado");
    }
  }
}

// Ouvinte do campo de busca em tempo real
document.getElementById("busca").addEventListener("input", function (event) {
  renderizarTabela(event.target.value);
});

// --- Central de Desafios (Módulo de Gamificação) ---

// Desafio da Média Geral da Sala
document.getElementById("desafioMedia").addEventListener("click", function () {
  if (alunos.length === 0) {
    alert("Cadastre ao menos um estudante para calcular a média da sala!");
    return;
  }

  let somaMedias = 0;
  for (const aluno of alunos) {
    somaMedias += calcularMediaPonderada(aluno.notas);
  }
  const mediaGeralSala = somaMedias / alunos.length;

  alert(`🎯 Desafio Matemático:\nA média geral de desempenho de todos os alunos cadastrados na sala é: ${mediaGeralSala.toFixed(2)}`);
});

// Desafio de Busca Avançada por Conceito Máximo
document.getElementById("desafioBusca").addEventListener("click", function () {
  if (alunos.length === 0) {
    alert("Nenhum estudante cadastrado para o desafio de busca.");
    return;
  }

  // Encontra o aluno com a maior média
  let melhorAluno = alunos[0];
  let melhorMedia = calcularMediaPonderada(melhorAluno.notas);

  for (const aluno of alunos) {
    const media = calcularMediaPonderada(aluno.notas);
    if (media > melhorMedia) {
      melhorMedia = media;
      melhorAluno = aluno;
    }
  }

  const freqMelhor = (melhorAluno.presencas / melhorAluno.aulasTotais * 100).toFixed(1);
  const conceitoMelhor = conceito(melhorMedia);

  // Também lista todos os alunos com conceito A
  const destaques = alunos.filter(aluno => conceito(calcularMediaPonderada(aluno.notas)) === "A");

  let mensagem = `🏆 Aluno Destaque da Turma:\n\n`;
  mensagem += `👤 Nome: ${melhorAluno.nome}\n`;
  mensagem += `📊 Média: ${melhorMedia.toFixed(1)}\n`;
  mensagem += `🎓 Conceito: ${conceitoMelhor}\n`;
  mensagem += `📋 Frequência: ${freqMelhor}%\n`;

  if (destaques.length > 1) {
    const outrosDestaques = destaques.filter(a => a.id !== melhorAluno.id).map(a => a.nome).join(", ");
    if (outrosDestaques) {
      mensagem += `\n⭐ Outros alunos com Conceito A: ${outrosDestaques}`;
    }
  } else if (destaques.length === 0) {
    mensagem += `\n📌 Nenhum aluno atingiu o Conceito A até o momento.`;
  }

  alert(mensagem);

  // Dispara confetes para celebrar o destaque
  dispararConfetes();
});

// --- Efeitos Visuais e Máscaras de Input ---

// Função auxiliar para criar chuva de confetes com CSS customizado
function dispararConfetes() {
  const quantidade = 40;
  const cores = ["#4f46e5", "#10b981", "#3b82f6", "#f59e0b", "#ec4899"];

  for (let i = 0; i < quantidade; i++) {
    const confete = document.createElement("div");
    confete.className = "confete-dinamico";

    // Estilos inline aleatórios passados para variáveis do CSS
    const corAleatoria = cores[Math.floor(Math.random() * cores.length)];
    confete.style.backgroundColor = corAleatoria;

    const xStart = Math.random() * 100; // Posição horizontal na tela (vw)
    const yStart = -10;
    const xEnd = xStart + (Math.random() * 30 - 15);
    const duracao = Math.random() * 2 + 1.5;
    const delay = Math.random() * 0.4;
    const rotEnd = Math.random() * 720 - 360;

    confete.style.setProperty("--x-start", `${xStart}vw`);
    confete.style.setProperty("--y-start", `${yStart}px`);
    confete.style.setProperty("--x-end", `${xEnd}vw`);
    confete.style.setProperty("--duracao", `${duracao}s`);
    confete.style.setProperty("--rot-end", `${rotEnd}deg`);

    confete.style.animation = `cair-e-girar var(--duracao) ease-out forwards`;
    confete.style.animationDelay = `${delay}s`;

    document.body.appendChild(confete);

    // Remove o elemento após a animação finalizar
    setTimeout(() => {
      confete.remove();
    }, (duracao + delay) * 1000);
  }
}

// Aplica a máscara de telefone (ex: 82 98888-8888) em tempo real
document.getElementById("telefone").addEventListener("input", function (event) {
  let num = event.target.value.replace(/\D/g, "");
  if (num.length > 11) num = num.substring(0, 11);

  if (num.length > 6) {
    event.target.value = `${num.substring(0, 2)} ${num.substring(2, 7)}-${num.substring(7)}`;
  } else if (num.length > 2) {
    event.target.value = `${num.substring(0, 2)} ${num.substring(2)}`;
  } else {
    event.target.value = num;
  }
});