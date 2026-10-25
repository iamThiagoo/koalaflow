import Image from 'next/image';
import dashboardPreview from './images/dashboard-preview.png';
import { enter, Words } from './motion';

const titleDelay = 600;
const titleStep = 62.5;

export function Showcase() {
  return (
    <aside className="relative hidden w-[760px] max-w-[54%] shrink-0 overflow-hidden rounded-[32px] bg-background lg:block">
      <Image
        src={dashboardPreview}
        alt=""
        sizes="712px"
        className="absolute top-12 left-12 w-[712px] max-w-none animate-enter"
        style={enter(200, { duration: 900, y: 40 })}
      />
      <div className="absolute inset-x-0 bottom-0 h-[560px] bg-linear-to-b from-background/0 via-45% via-background to-background" />
      <div className="absolute inset-x-6 bottom-18 mx-auto flex max-w-[560px] flex-col items-center gap-3 text-center">
        <h2 className="font-bold text-[28px] text-text-primary leading-9 tracking-[-0.28px]">
          <span className="block text-primary-strong">
            <Words
              text="Seus vídeos protegidos,"
              delay={titleDelay}
              step={titleStep}
            />
          </span>
          <span className="block">
            <Words
              text="do upload ao play"
              delay={titleDelay + 3 * titleStep}
              step={titleStep}
            />
          </span>
        </h2>
        <p
          className="animate-enter text-sm text-text-secondary leading-5"
          style={enter(850, { y: 10 })}
        >
          Acompanhe plays, retenção e consumo de cada vídeo em um só painel.
        </p>
        <div
          aria-hidden
          className="flex animate-enter items-center gap-1.5"
          style={enter(1000, { duration: 500, scale: 0.6, pop: true })}
        >
          <span className="h-1.5 w-6 rounded-[3px] bg-primary" />
          <span className="size-1.5 rounded-[3px] bg-border" />
        </div>
      </div>
    </aside>
  );
}
