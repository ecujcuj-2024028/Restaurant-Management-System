import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../shared/constants/colors';
import { COMMON_STYLES } from '../../../shared/constants/theme';
import useAuthStore from '../../../store/useAuthStore';
import Typography from '../../../shared/components/common/Typography';
import Input from '../../../shared/components/common/Input';

const HelpSupportScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { isDarkMode } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFaq, setActiveFaq] = useState(null); // ID of active collapsible FAQ



  const bgColor = isDarkMode ? COLORS.darkBackground : '#F5F5F5';
  const cardColor = isDarkMode ? COLORS.darkSurface : COLORS.white;
  const textColor = isDarkMode ? COLORS.darkText : COLORS.text;
  const textSecondary = isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const borderColor = isDarkMode ? COLORS.darkBorder : COLORS.border;

  // Local static list of FAQs
  const faqs = useMemo(() => [
    {
      id: 1,
      question: t('help.faq_order_q') || '¿Cómo realizo un pedido?',
      answer: t('help.faq_order_a') || 'Ve a la pestaña de inicio, selecciona un restaurante, añade platos a tu carrito y presiona "Proceder al Pago". Recueda que debes de tener una reserva activa.'
    },
    {
      id: 2,
      question: t('help.faq_reservation_q') || '¿Cómo cancelo una reserva?',
      answer: t('help.faq_reservation_a') || 'Tienes 5 minutos para cancelar una reserva, Ve a Menu y selecciona Mis Reservas, selecciona la reserva que deseas cancelar y presiona el botón "Cancelar Reserva".'
    },
    {
      id: 3,
      question: t('help.faq_payment_q') || '¿Qué métodos de pago aceptan?',
      answer: t('help.faq_payment_a') || 'Aceptamos tarjetas de crédito/débito (Visa, Mastercard), transferencias locales y efectivo al momento de entrega.'
    },
    {
      id: 4,
      question: t('help.faq_refund_q') || '¿Cuánto tiempo tarda un reembolso?',
      answer: t('help.faq_refund_a') || 'Los reembolsos suelen procesarse de 3 a 5 días hábiles dependiendo de tu entidad bancaria.'
    }
  ], [t]);

  // Client-side FAQ search filter
  const filteredFaqs = useMemo(() => {
    return faqs.filter(faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [faqs, searchQuery]);



  // Directly link actions
  const handleOpenLink = (url, fallbackMsg) => {
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Soporte', fallbackMsg);
      }
    });
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: bgColor }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 80}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Typography variant="h2" color={textColor}>
            {t('menu.help')}
          </Typography>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false} 
          keyboardShouldPersistTaps="handled"
        >
          {/* FAQ search bar */}
          <Input
            placeholder={t('help.search_placeholder') || 'Buscar ayuda o preguntas...'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchBar}
            leftIcon={<Ionicons name="search-outline" size={20} color={textSecondary} />}
          />

          {/* FAQs section */}
          <Typography variant="bodyBold" color={textColor} style={styles.sectionTitle}>
            {t('help.faq_title') || 'Preguntas Frecuentes'}
          </Typography>
          <View style={styles.faqList}>
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq) => {
                const isOpen = activeFaq === faq.id;
                return (
                  <View key={faq.id} style={[styles.faqCard, { backgroundColor: cardColor, borderColor }]}>
                    <TouchableOpacity 
                      style={styles.faqHeader} 
                      onPress={() => setActiveFaq(isOpen ? null : faq.id)}
                      activeOpacity={0.7}
                    >
                      <Typography variant="bodyBold" color={textColor} style={{ flex: 1 }}>
                        {faq.question}
                      </Typography>
                      <Ionicons 
                        name={isOpen ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color={textSecondary} 
                      />
                    </TouchableOpacity>
                    {isOpen && (
                      <View style={styles.faqAnswer}>
                        <Typography variant="body" color={textSecondary}>
                          {faq.answer}
                        </Typography>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <Typography variant="body" color={textSecondary} style={{ textAlign: 'center', marginTop: 10 }}>
                {t('help.no_results') || 'No encontramos respuestas para tu búsqueda.'}
              </Typography>
            )}
          </View>

          {/* Contact options */}
          <Typography variant="bodyBold" color={textColor} style={[styles.sectionTitle, { marginTop: 24 }]}>
            {t('help.contact_channels') || 'Contacto Directo'}
          </Typography>
          <View style={styles.channelRow}>
            {/* WhatsApp */}
            <TouchableOpacity 
              style={[styles.channelCard, { backgroundColor: cardColor }]}
              onPress={() => handleOpenLink('https://wa.me/50212345678', 'Instala WhatsApp para chatear con soporte.')}
            >
              <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
              <Typography variant="smallBold" color={textColor} style={{ marginTop: 6 }}>WhatsApp</Typography>
            </TouchableOpacity>

            {/* Telephone Call */}
            <TouchableOpacity 
              style={[styles.channelCard, { backgroundColor: cardColor }]}
              onPress={() => handleOpenLink('tel:+50212345678', 'Llama a soporte al +502 1234 5678')}
            >
              <Ionicons name="call-outline" size={28} color={COLORS.primary} />
              <Typography variant="smallBold" color={textColor} style={{ marginTop: 6 }}>Llamar</Typography>
            </TouchableOpacity>

            {/* Email Support */}
            <TouchableOpacity 
              style={[styles.channelCard, { backgroundColor: cardColor }]}
              onPress={() => handleOpenLink('mailto:soporte@restaurant.com?subject=AyudaApp', 'Escribe a soporte@restaurant.com')}
            >
              <Ionicons name="mail-outline" size={28} color="#E4405F" />
              <Typography variant="smallBold" color={textColor} style={{ marginTop: 6 }}>Correo</Typography>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  searchBar: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  faqList: {
    gap: 10,
  },
  faqCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  channelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  channelCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default HelpSupportScreen;
