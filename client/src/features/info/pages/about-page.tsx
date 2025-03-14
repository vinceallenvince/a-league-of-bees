import { useTranslation } from "react-i18next";

export default function AboutPage() {
  const { t } = useTranslation();
  
  return (
    <div className="container py-8" role="main">
      <section>
        <h1 className="text-3xl font-bold mb-6">{t('aboutPage.title')}</h1>
        <p className="mb-4">{t('aboutPage.paragraph1')}</p>
        <p className="mb-4">{t('aboutPage.paragraph2')}</p>
      </section>
    </div>
  );
} 