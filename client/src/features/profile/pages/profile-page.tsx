import { ProfileForm } from "@/features/profile/components/profile-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/card";
import { useTranslation } from "react-i18next";

export default function ProfilePage() {
  const { t } = useTranslation();
  
  return (
    <div className="container py-8" role="main">
      <section aria-labelledby="profile-title">
        <Card>
          <CardHeader>
            <CardTitle id="profile-title" as="h1">{t('profile.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm />
          </CardContent>
        </Card>
      </section>
    </div>
  );
} 