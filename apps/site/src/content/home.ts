/**
 * Rule: the site is Portuguese-only; all visible copy lives in this file.
 */
export const home = {
  metadata: {
    title: 'Koalaflow: hospedagem de vídeos protegidos para empresas',
    description:
      'Hospede, proteja e entregue vídeos com URLs assinadas, players restritos por domínio e streaming adaptativo em HLS.',
  },
  header: {
    signIn: 'Entrar',
  },
  hero: {
    eyebrow: 'Vídeo protegido para o seu negócio',
    title: 'Seus vídeos, só onde você quiser',
    subtitle:
      'O Koalaflow hospeda, converte e entrega seus vídeos com segurança. Privados por padrão, liberados apenas para os domínios que você autorizar.',
    primaryCta: 'Começar agora',
    secondaryCta: 'Falar com vendas',
  },
  highlights: {
    title: 'Feito para conteúdo que não pode vazar',
    items: [
      {
        title: 'Entrega segura',
        description:
          'Cada reprodução usa URLs assinadas e temporárias. Links copiados expiram e deixam de funcionar.',
      },
      {
        title: 'Embeds restritos por domínio',
        description:
          'O player só abre nos sites que você autorizar. Em qualquer outro lugar, o vídeo não carrega.',
      },
      {
        title: 'Streaming adaptativo',
        description:
          'Conversão automática para HLS em várias qualidades, para o vídeo rodar bem em qualquer conexão.',
      },
      {
        title: 'Upload direto para a nuvem',
        description:
          'Arquivos grandes sobem direto do navegador para o armazenamento, em partes e com retomada.',
      },
    ],
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
  callToAction: {
    title: 'Pronto para proteger seus vídeos?',
    subtitle:
      'Crie sua conta ou fale com o nosso time para encontrar o plano certo.',
    primaryCta: 'Começar agora',
    secondaryCta: 'Falar com vendas',
  },
  footer: {
    tagline: 'Hospedagem de vídeos protegidos.',
    rights: 'Todos os direitos reservados.',
  },
  notFound: {
    title: 'Página não encontrada',
    message: 'O endereço que você acessou não existe.',
    backHome: 'Voltar para o início',
  },
};

export type HomeContent = typeof home;
