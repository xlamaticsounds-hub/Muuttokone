interface SectionTitleProps {
  title: string;
  subtitle: string;
}

export default function SectionTitle({ title, subtitle }: SectionTitleProps) {
  return (
    <>
      <div className="animate_top relative z-10 mx-auto max-w-1390 px-4 text-center md:px-8 xl:px-0">
        <h2 className="xl:text-title-xl mx-auto mb-4.5 text-3xl font-semibold text-black md:w-4/5 xl:w-1/2 dark:text-white">
          {title}
        </h2>
        <p className="mx-auto md:w-4/5 lg:w-3/5 xl:w-[46%]">{subtitle}</p>
      </div>
    </>
  );
}
