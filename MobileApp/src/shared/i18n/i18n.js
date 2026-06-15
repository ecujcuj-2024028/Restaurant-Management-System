import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import es from './locales/es.json';
import en from './locales/en.json';
import pt from './locales/pt.json';
import zh from './locales/zh.json';

const LANGUAGE_KEY = 'app_language';

const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      const storedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (storedLanguage) {
        callback(storedLanguage);
        return;
      }
      callback('es');
    } catch (error) {
      console.log('Error reading language', error);
      callback('es');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    } catch (error) {
      console.log('Error saving language', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    fallbackLng: 'es',
    resources: {
      es: { translation: es },
      en: { translation: en },
      pt: { translation: pt },
      zh: { translation: zh },
    },
    interpolation: {
      escapeValue: false, // react ya protege de xss
    },
    react: {
      useSuspense: false,
    }
  });

export default i18n;
