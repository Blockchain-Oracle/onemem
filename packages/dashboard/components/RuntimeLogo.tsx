import Image from "next/image";
import { Icon } from "@/components/Icon";
import { vendorLogoSrc } from "@/lib/vendor-logos";

export function RuntimeLogo({
  id,
  name,
  icon = "cube",
  size = 18,
}: {
  id: string;
  name?: string;
  icon?: string;
  size?: 14 | 16 | 18 | 20;
}) {
  const src = vendorLogoSrc(id);
  if (src) {
    return (
      <Image
        src={src}
        alt={name ? `${name} logo` : ""}
        className="vendor-logo-img"
        width={size}
        height={size}
        unoptimized
      />
    );
  }
  return <Icon name={icon} size={size} />;
}
