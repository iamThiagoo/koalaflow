import Image from 'next/image';

export function Logo() {
  return (
    <Image
      src="/landing/logo.png"
      alt="Koalaflow"
      loading="eager"
      width={923}
      height={198}
      className="block h-7 w-[130.5px] object-contain"
    />
  );
}

export function LogoWhite() {
  return (
    <span
      role="img"
      aria-label="Koalaflow"
      className="block h-7 w-[130.525px] shrink-0 bg-white [mask-image:url(/landing/logo-white-mask.svg)] [mask-mode:luminance] [mask-repeat:no-repeat] [mask-size:100%_100%]"
    />
  );
}
