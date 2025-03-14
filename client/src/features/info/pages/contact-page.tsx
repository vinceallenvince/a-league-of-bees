import { useTranslation } from "react-i18next";

export default function ContactPage() {
  const { t } = useTranslation();
  
  return (
    <div className="container py-8" role="main">
      <section>
        <h1 className="text-3xl font-bold mb-6">{t('contactPage.title')}</h1>
        <p className="mb-4">{t('contactPage.paragraph1')}</p>
        <p className="mb-4">{t('contactPage.paragraph2')}</p>
      </section>
    </div>
  );
} 