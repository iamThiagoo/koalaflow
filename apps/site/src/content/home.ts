import type { LinkTarget } from '@/links';
import { formatMinutes, linkLifetimeMinutes } from '@/theft-demo';

interface ContentLink {
  label: string;
  to?: LinkTarget;
}

export const home = {
  metadata: {
    title: 'Koalaflow: hospedagem de vídeos protegidos para empresas',
    description:
      'Hospede, proteja e entregue vídeos com URLs assinadas, players restritos por domínio e streaming adaptativo em HLS.',
  },
  contact: {
    supportEmail: 'suporte@koalaflow.com',
  },
  header: {
    homeLabel: 'Koalaflow, página inicial',
    navigationLabel: 'Navegação principal',
    navigation: [
      { label: 'Produto', to: '#produto' },
      { label: 'Como funciona', to: '#como-funciona' },
      { label: 'Desenvolvedores', to: '#desenvolvedores' },
    ] satisfies ContentLink[],
    signIn: 'Entrar',
    primaryCta: 'Começar agora',
    primaryCtaShort: 'Começar',
    salesCta: 'Falar com vendas',
    openMenu: 'Abrir menu',
    closeMenu: 'Fechar menu',
  },
  hero: {
    headline: {
      lead: 'Quero que meus',
      bridge: 'só',
      bridgeTail: 'toquem em',
      end: '.',
      closing: 'Fora dele, o vídeo',
      closingAccent: 'não carrega.',
    },
    contentTypeLabel: 'Tipo de conteúdo',
    contentTypes: ['cursos', 'treinamentos', 'aulas', 'webinars', 'vídeos'],
    domainLabel: 'Domínio autorizado',
    domains: ['meusite.com.br', 'alunos.minhaescola.com', 'app.empresa.com'],
    description:
      'URLs assinadas que expiram, players restritos por domínio e streaming em HLS.',
    primaryCta: 'Começar agora',
    microcopyStrong: 'Privado por padrão',
    microcopy: '. Sem configurar servidor.',
    showcase: {
      dashboardAlt:
        'Painel do Koalaflow com minutos assistidos, plays por dia, consumo e envios recentes.',
      annotation: 'Veja quem assistiu e até onde!',
      pills: {
        format: '1080p · HLS',
        domain: 'Domínio autorizado ✓',
        expiry: 'Link expira em 5 min',
        processing: 'Processando 72%',
      },
      player: {
        series: 'ACADEMIA · CONTEÚDO EXCLUSIVO',
        title: 'O próximo passo começa aqui.',
        time: '01:08 / 04:32',
        quality: 'Auto · 1080p',
      },
    },
  },
  protection: {
    claim: `${formatMinutes(linkLifetimeMinutes)}.`,
    claimTail: 'É o que dura um link copiado.',
    subtitle: [
      'Copiou, colou no grupo do Telegram? Quando alguém clicar, já era.',
      'O player só toca nos domínios que você liberou.',
    ],
    items: [
      {
        icon: 'lock',
        text: 'Privado por padrão. Nem precisa lembrar de trancar.',
      },
      {
        icon: 'cloud',
        text: 'Sobe 10 GB sem medo. Caiu a net? Continua de onde parou.',
      },
      {
        icon: 'code',
        text: 'Um iframe e pronto. Roda na sua plataforma de curso.',
      },
      {
        icon: 'signal',
        text: 'Roda liso até no 4G do ônibus.',
      },
    ],
    cta: 'Tenta roubar esse vídeo',
    microcopyStrong: 'Privado por padrão.',
    microcopy: ' Sem configurar servidor.',
    demo: {
      label:
        'Demonstração: tente assistir a um vídeo protegido fora do site autorizado',
      authorizedHost: 'alunos.minhaescola.com',
      otherHost: 'cursinho-pirata.example',
      videoTitle: 'Aula 07 · Conteúdo exclusivo',
      linkLabel: 'Link assinado do vídeo',
      expiresIn: 'Expira em',
      expiredBadge: 'Expirado',
      intro:
        'Esse é o player no site do curso. Copie o link do vídeo e tente assistir em outro lugar.',
      simulationNote: 'É uma simulação: nada é copiado de verdade.',
      playing: 'Tocando',
      actions: {
        pasteElsewhere: 'Copiar e colar em outro site',
        openAuthorized: 'Abrir o link copiado no site do curso',
        skip: `Pular ${formatMinutes(linkLifetimeMinutes)}`,
        restart: 'Tentar de novo',
      },
      outcomes: {
        plays: {
          title: 'Ainda toca, por enquanto.',
          body: 'No site autorizado, o link vale até a contagem zerar.',
        },
        blockedDomain: {
          title: 'Esse vídeo não carrega aqui.',
          body: 'Domínio não autorizado: o player só abre nos sites que o dono do vídeo liberou.',
        },
        expired: {
          title: 'Esse link expirou.',
          body: `Cada link vale ${formatMinutes(linkLifetimeMinutes)}. Depois disso, não toca nem no site do curso.`,
        },
      },
      primaryCta: 'Começar agora',
      fallback: {
        intro:
          'Na demonstração, você copia o link assinado de um vídeo e tenta assistir fora do site do curso. O resultado:',
        outcomes: [
          'Em outro site: “Esse vídeo não carrega aqui.” O domínio não está autorizado.',
          `Depois de ${formatMinutes(linkLifetimeMinutes)}: o link expira e não toca nem no site do curso.`,
        ],
      },
    },
  },
  howItWorks: {
    title: 'Como funciona',
    steps: [
      {
        title: 'Envie',
        description: 'Faça upload dos seus vídeos pelo painel.',
      },
      {
        title: 'Processamos',
        description:
          'Convertemos cada vídeo para streaming adaptativo, pronto para qualquer tela.',
      },
      {
        title: 'Incorpore',
        description:
          'Cole o player no seu site ou plataforma e escolha quais domínios podem exibi-lo.',
      },
    ],
  },
  faq: {
    titleAccent: 'Ficou alguma dúvida?',
    title: 'A gente responde.',
    subtitle:
      'Separamos as perguntas que mais recebemos de quem está começando a proteger os próprios vídeos.',
    primaryCta: 'Começar agora',
    microcopyStrong: 'Privado por padrão.',
    microcopy: ' Sem configurar servidor.',
    supportLink: 'Não achou sua resposta? Fale com a gente',
    items: [
      {
        question: 'Meus vídeos ficam públicos?',
        answer:
          'Não. Todo vídeo é privado por padrão e só toca nos domínios que você autorizar.',
      },
      {
        question: 'Alguém consegue copiar o link e assistir em outro site?',
        answer:
          'Não. Cada reprodução usa uma URL assinada que expira em poucos minutos, e o player só carrega nos domínios liberados. Nenhuma solução impede gravação de tela, mas o link copiado deixa de funcionar.',
      },
      {
        question: 'Funciona com a minha plataforma de cursos?',
        answer:
          'Se a plataforma aceita código de incorporação (iframe), sim. É só colar o player e liberar o domínio dela no painel. [confirmar]',
      },
      {
        question: 'Consigo enviar arquivos grandes?',
        answer:
          'Sim. O upload vai direto do navegador para a nuvem, em partes, e retoma de onde parou se a conexão cair.',
      },
      {
        question: 'Quanto tempo o vídeo leva para ficar pronto?',
        answer:
          'Depende da duração. Você acompanha o status no painel, de "Processando" a "Pronto", e recebe um webhook quando terminar. [confirmar prazo médio]',
      },
      {
        question: 'Quais formatos de vídeo posso enviar?',
        answer:
          'MP4, MOV e os formatos mais comuns. Nós convertemos tudo para streaming adaptativo em várias qualidades. [confirmar lista]',
      },
    ],
  },
  finalInvitation: {
    title: 'Pronto para o seu',
    titleAccent: 'momento de criação?',
    subtitle:
      'Envie seu primeiro vídeo hoje. Privado por padrão, liberado só onde você quiser.',
    primaryCta: 'Começar agora',
    reassurance: 'Sem cartão para testar. Cancele quando quiser.',
  },
  footer: {
    columns: [
      {
        id: 'produto-links',
        title: 'Produto',
        links: [
          { label: 'Hospedagem protegida' },
          { label: 'Player e embed' },
          { label: 'Streaming HLS' },
          { label: 'Analytics' },
        ],
      },
      {
        id: 'para-quem',
        title: 'Para quem',
        links: [
          { label: 'Cursos online' },
          { label: 'Edtechs' },
          { label: 'Treinamento corporativo' },
          { label: 'Eventos e mídia' },
        ],
      },
      {
        id: 'desenvolvedores',
        title: 'Desenvolvedores',
        links: [
          { label: 'Documentação' },
          { label: 'API' },
          { label: 'Webhooks' },
          { label: 'Status dos serviços' },
        ],
      },
      {
        id: 'empresa',
        title: 'Empresa',
        links: [{ label: 'Falar com vendas', to: 'sales' }, { label: 'Blog' }],
      },
      {
        id: 'suporte',
        title: 'Suporte',
        links: [
          { label: 'suporte@koalaflow.com', to: 'support' },
          { label: 'Central de ajuda' },
        ],
      },
      {
        id: 'legal',
        title: 'Legal',
        links: [
          { label: 'Termos de uso' },
          { label: 'Política de privacidade' },
          { label: 'LGPD' },
        ],
      },
    ] satisfies { id: string; title: string; links: ContentLink[] }[],
    copyright: 'Koalaflow · [Razão social] · CNPJ [00.000.000/0000-00]',
    legal: {
      before:
        'O Koalaflow hospeda e entrega vídeos dos seus clientes com acesso restrito. Os dados são tratados conforme a LGPD e os nossos ',
      terms: 'Termos de uso',
      between: ' e ',
      privacy: 'Política de privacidade',
      after: '.',
    },
    socialLabel: 'Redes sociais',
    socials: [
      { network: 'linkedin', label: 'LinkedIn' },
      { network: 'instagram', label: 'Instagram' },
      { network: 'youtube', label: 'YouTube' },
      { network: 'github', label: 'GitHub' },
    ],
  },
  notFound: {
    title: 'Página não encontrada',
    message: 'O endereço que você acessou não existe.',
    backHome: 'Voltar para o início',
  },
};

export type HomeContent = typeof home;
