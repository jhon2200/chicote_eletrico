const botaoMenu = document.querySelector('.menu-botao');
const menu = document.querySelector('.menu');

botaoMenu?.addEventListener('click', () => {
  const aberto = menu.classList.toggle('aberto');
  botaoMenu.setAttribute('aria-expanded', String(aberto));
  botaoMenu.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
});

menu?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menu.classList.remove('aberto');
    botaoMenu?.setAttribute('aria-expanded', 'false');
    botaoMenu?.setAttribute('aria-label', 'Abrir menu');
  });
});

const canvasVeiculo = document.querySelector('#veiculo-canvas');
const controlesHotspot = [...document.querySelectorAll('[data-hotspot-alvo]')];
const pontosImagem = [...document.querySelectorAll('.ponto-hotspot')];
const painelInfo = document.querySelector('.painel-info');
const painelEstado = document.querySelector('.painel-estado');
const painelTitulo = document.querySelector('.painel-titulo');
const painelDetalhes = document.querySelector('.painel-detalhes');
const painelFechar = document.querySelector('.painel-fechar');
const [painelOQue, painelFaz, painelImportancia] = painelDetalhes?.querySelectorAll('p') ?? [];
const regioes = {
  dianteira: {
    nome: 'Ramificação dianteira',
    focoX: 21,
    focoY: 57,
    tipo: 'principal',
    oQue: 'É a parte do chicote que atende a região dianteira do veículo.',
    faz: 'Leva energia e sinais para componentes instalados na parte frontal.',
    importancia: 'Permite o funcionamento adequado dos sistemas elétricos localizados nessa região.'
  },
  motor: {
    nome: 'Ramificação do motor',
    focoX: 36,
    focoY: 62,
    tipo: 'principal',
    oQue: 'É a ramificação do chicote ligada ao sistema de motorização.',
    faz: 'Conecta componentes do motor e permite a transmissão de energia e sinais.',
    importancia: 'Contribui para o funcionamento e a comunicação dos sistemas ligados ao motor.'
  },
  cabine: {
    nome: 'Ramificação central / cabine',
    focoX: 52,
    focoY: 44,
    tipo: 'principal',
    oQue: 'É a parte do chicote que percorre a região central e interna do veículo.',
    faz: 'Distribui energia e sinais para diferentes sistemas da cabine.',
    importancia: 'Integra os equipamentos internos à rede elétrica do veículo.'
  },
  lateral: {
    nome: 'Ramificação da carroceria lateral',
    focoX: 66,
    focoY: 48,
    tipo: 'principal',
    oQue: 'É uma ramificação que percorre a estrutura lateral da carroceria.',
    faz: 'Conduz energia e sinais entre diferentes regiões do veículo.',
    importancia: 'Permite que o chicote seja distribuído de forma organizada pela carroceria.'
  },
  traseira: {
    nome: 'Ramificação traseira',
    focoX: 84,
    focoY: 40,
    tipo: 'principal',
    oQue: 'É a parte do chicote destinada à região traseira do veículo.',
    faz: 'Leva energia e sinais para os componentes instalados nessa região.',
    importancia: 'Garante a integração elétrica dos sistemas localizados na traseira.'
  },
  conector: {
    nome: 'Conector / terminal',
    focoX: 40,
    focoY: 38,
    tipo: 'secundario',
    oQue: 'Elemento utilizado para realizar conexões elétricas entre diferentes partes do sistema.',
    faz: 'Permite ligar componentes e facilita a montagem e desmontagem.',
    importancia: 'Uma conexão adequada ajuda a evitar mau contato e melhora a confiabilidade do sistema.'
  },
  protecao: {
    nome: 'Proteção do chicote',
    focoX: 63,
    focoY: 21,
    tipo: 'secundario',
    oQue: 'É o revestimento utilizado para proteger fios e cabos.',
    faz: 'Ajuda a proteger contra atrito, calor, vibração e outros agentes.',
    importancia: 'Reduz a possibilidade de danos e aumenta a durabilidade do chicote.'
  },
  fixacao: {
    nome: 'Fixação',
    focoX: 56,
    focoY: 71,
    tipo: 'secundario',
    oQue: 'Elemento utilizado para prender e posicionar o chicote no veículo.',
    faz: 'Mantém o chicote organizado e seguindo o percurso correto.',
    importancia: 'Ajuda a evitar deslocamentos, atrito excessivo e possíveis danos.'
  }
};
Object.entries(regioes).forEach(([id, regiao]) => { regiao.id = id; });
let hotspotSelecionado = null;
let timerTransicaoRegiao = null;

function posicionarNomeRegiao(hotspot) {
  if (!canvasVeiculo || !hotspot) return;
  const ponto = document.querySelector(`.ponto-hotspot[data-hotspot-alvo="${hotspot.id}"]`);
  const nome = document.querySelector(`.nome-regiao-${hotspot.id}`);
  if (!ponto || !nome) return;

  requestAnimationFrame(() => {
    const largura = nome.offsetWidth;
    const altura = nome.offsetHeight;
    const x = ponto.offsetLeft;
    const y = ponto.offsetTop;
    const distancia = 16;
    const margem = 8;
    const candidatos = [
      { posicao: 'acima', left: x - largura / 2, top: y - altura - distancia },
      { posicao: 'abaixo', left: x - largura / 2, top: y + distancia },
      { posicao: 'direita', left: x + distancia, top: y - altura / 2 },
      { posicao: 'esquerda', left: x - largura - distancia, top: y - altura / 2 }
    ];

    const pontuados = candidatos.map((candidato, ordem) => {
      const direita = candidato.left + largura;
      const base = candidato.top + altura;
      let penalidade = ordem;
      penalidade += Math.max(0, margem - candidato.left) * 100;
      penalidade += Math.max(0, direita - canvasVeiculo.clientWidth + margem) * 100;
      penalidade += Math.max(0, margem - candidato.top) * 100;
      penalidade += Math.max(0, base - canvasVeiculo.clientHeight + margem) * 100;

      pontosImagem.forEach((outroPonto) => {
        if (outroPonto === ponto) return;
        const outroX = outroPonto.offsetLeft;
        const outroY = outroPonto.offsetTop;
        const sobrepoe = outroX >= candidato.left - 18 && outroX <= direita + 18 &&
          outroY >= candidato.top - 18 && outroY <= base + 18;
        if (sobrepoe) penalidade += 1000;
      });
      return { ...candidato, penalidade };
    });

    pontuados.sort((a, b) => a.penalidade - b.penalidade);
    const melhor = pontuados[0];
    nome.style.left = `${Math.min(Math.max(melhor.left, margem), canvasVeiculo.clientWidth - largura - margem)}px`;
    nome.style.top = `${Math.min(Math.max(melhor.top, margem), canvasVeiculo.clientHeight - altura - margem)}px`;
    nome.dataset.posicao = melhor.posicao;
  });
}

function definirFoco(hotspot, intensidade) {
  if (!canvasVeiculo || !hotspot) return;
  clearTimeout(timerTransicaoRegiao);
  canvasVeiculo.classList.add('transicao-regiao');
  canvasVeiculo.dataset.regiaoAtiva = hotspot.id;
  canvasVeiculo.dataset.tipoAtivo = hotspot.tipo;
  canvasVeiculo.style.transformOrigin = `${hotspot.focoX}% ${hotspot.focoY}%`;
  canvasVeiculo.classList.toggle('em-hover', intensidade === 'hover');
  canvasVeiculo.classList.toggle('com-selecao', intensidade === 'selecao');
  posicionarNomeRegiao(hotspot);
}

function limparFocoTemporario() {
  if (hotspotSelecionado) {
    definirFoco(hotspotSelecionado, 'selecao');
    return;
  }
  canvasVeiculo?.classList.remove('em-hover', 'com-selecao');
  if (canvasVeiculo) {
    delete canvasVeiculo.dataset.regiaoAtiva;
    delete canvasVeiculo.dataset.tipoAtivo;
    canvasVeiculo.style.transformOrigin = '50% 50%';
    timerTransicaoRegiao = setTimeout(() => {
      canvasVeiculo.classList.remove('transicao-regiao');
    }, 340);
  }
}

function abrirRamificacao(hotspot) {
  hotspotSelecionado = hotspot;
  controlesHotspot.forEach((controle) => {
    const ativo = controle.dataset.hotspotAlvo === hotspot.id;
    controle.classList.toggle('ativo', ativo);
    controle.setAttribute('aria-pressed', String(ativo));
  });
  definirFoco(hotspot, 'selecao');

  const secundario = hotspot.tipo === 'secundario';
  painelEstado.textContent = secundario ? 'Componente selecionado' : 'Ramificação selecionada';
  painelTitulo.textContent = hotspot.nome;
  painelOQue.textContent = hotspot.oQue;
  painelFaz.textContent = hotspot.faz;
  painelImportancia.textContent = hotspot.importancia;
  painelDetalhes.hidden = false;
  painelInfo.hidden = false;
  painelInfo.classList.add('aberto');
}

function fecharRamificacao() {
  hotspotSelecionado = null;
  controlesHotspot.forEach((controle) => {
    controle.classList.remove('ativo');
    controle.setAttribute('aria-pressed', 'false');
  });
  limparFocoTemporario();
  painelInfo.classList.remove('aberto');
  painelDetalhes.hidden = true;
  painelInfo.hidden = true;
}

painelFechar?.addEventListener('click', fecharRamificacao);

controlesHotspot.forEach((controle) => {
  controle.setAttribute('aria-pressed', 'false');
  controle.setAttribute('aria-controls', 'detalhes-hotspot');
  controle.addEventListener('click', () => {
    const hotspot = regioes[controle.dataset.hotspotAlvo];
    if (!hotspot) return;
    if (hotspotSelecionado === hotspot) {
      fecharRamificacao();
    } else {
      abrirRamificacao(hotspot);
    }
  });
});

pontosImagem.forEach((ponto) => {
  const hotspot = regioes[ponto.dataset.hotspotAlvo];
  if (!hotspot) return;
  ponto.addEventListener('mouseenter', () => {
    if (!hotspotSelecionado) definirFoco(hotspot, 'hover');
  });
  ponto.addEventListener('mouseleave', limparFocoTemporario);
  ponto.addEventListener('focus', () => {
    if (!hotspotSelecionado) definirFoco(hotspot, 'hover');
  });
  ponto.addEventListener('blur', limparFocoTemporario);
});

window.addEventListener('resize', () => {
  const idAtivo = canvasVeiculo?.dataset.regiaoAtiva;
  if (!idAtivo) return;
  posicionarNomeRegiao(regioes[idAtivo]);
});
