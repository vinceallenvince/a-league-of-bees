import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-100 mt-auto py-6" role="contentinfo">
      <div className="container">
        <nav aria-label="Footer navigation">
          <ul className="flex justify-start space-x-6 list-none">
            <li>
              <Link 
                href="/about" 
                className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                {t('navigation.about')}
              </Link>
            </li>
            <li>
              <Link 
                href="/contact" 
                className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                {t('navigation.contact')}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
};

export default Footer; 