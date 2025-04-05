interface CategoryCardProps {
  title: string;
  description: string;
  image: string;
  href: string;
}

export function CategoryCard({
  title,
  description,
  image,
  href,
}: CategoryCardProps) {
  return (
    <a
      href={href}
      className="group relative block h-[300px] overflow-hidden rounded-lg"
    >
      <img
        src={image}
        alt={title}
        className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <h3 className="text-2xl font-bold">{title}</h3>
        <p className="mt-2 text-sm text-white/80">{description}</p>
      </div>
    </a>
  );
}
