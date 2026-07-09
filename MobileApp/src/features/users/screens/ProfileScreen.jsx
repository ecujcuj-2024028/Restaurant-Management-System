import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../shared/constants/colors';
import useAuthStore from '../../../store/useAuthStore';
import Typography from '../../../shared/components/common/Typography';
import Input from '../../../shared/components/common/Input';
import Button from '../../../shared/components/common/Button';
import { updateProfile, updatePassword, requestRoleUpgrade } from '../../../api/users';

const ProfileScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user, isDarkMode, fetchProfile, updateUser } = useAuthStore();

  React.useEffect(() => {
    fetchProfile();
  }, []);

  React.useEffect(() => {
    if (user) {
      setName(user.name || '');
      setSurname(user.surname || '');
      setPhone(user.phone || '');
      setUsername(user.username || user.Username || '');
    }
  }, [user]);

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security'

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [surname, setSurname] = useState(user?.surname || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [username, setUsername] = useState(user?.username || user?.Username || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Role Request State
  const [requestedRole, setRequestedRole] = useState('ADMIN_RESTAURANTE');
  const [isRequestingRole, setIsRequestingRole] = useState(false);

  // Colors
  const bgColor = isDarkMode ? COLORS.darkBackground : '#F5F5F5';
  const cardColor = isDarkMode ? COLORS.darkSurface : COLORS.white;
  const textColor = isDarkMode ? COLORS.darkText : COLORS.text;
  const textSecondary = isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const borderColor = isDarkMode ? COLORS.darkBorder : COLORS.border;

  const profileImage = user?.profilePicture || user?.avatar;

  // Handlers
  const handleUpdateProfile = async () => {
    if (!name.trim() || !surname.trim() || !phone.trim() || !username.trim()) {
      Alert.alert(t('common.error', 'Error'), t('profile.errorFields', 'Por favor, completa los campos requeridos'));
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const response = await updateProfile({ name, surname, username, phone });
      if (response.success && response.user) {
        await updateUser(response.user);
        Alert.alert(t('common.success', 'Éxito'), t('profile.successUpdate', 'Perfil actualizado correctamente'));
        fetchProfile(); // Refresh store data
      } else {
        Alert.alert(t('common.error', 'Error'), response.message || t('profile.errorUpdate', 'No se pudo actualizar el perfil'));
      }
    } catch (error) {
      Alert.alert(t('common.error', 'Error'), error.message || t('profile.errorUpdate', 'Ocurrió un error al actualizar el perfil'));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('common.error', 'Error'), t('profile.errorFields', 'Por favor, completa todos los campos de contraseña'));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error', 'Error'), t('profile.errorPasswordMatch', 'Las contraseñas nuevas no coinciden'));
      return;
    }

    setIsChangingPassword(true);
    try {
      await updatePassword({ currentPassword, newPassword });
      Alert.alert(t('common.success', 'Éxito'), t('profile.successPassword', 'Contraseña cambiada correctamente'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert(t('common.error', 'Error'), error.response?.data?.message || error.message || t('profile.errorPassword', 'No se pudo cambiar la contraseña'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRequestRole = async () => {
    setIsRequestingRole(true);
    try {
      await requestRoleUpgrade(requestedRole);
      Alert.alert(
        t('common.success', 'Éxito'),
        t('profile.successRole', 'Solicitud de rol enviada correctamente al administrador. Pendiente de aprobación.')
      );
    } catch (error) {
      Alert.alert(t('common.error', 'Error'), error.response?.data?.message || error.message || t('profile.errorRole', 'No se pudo enviar la solicitud de rol'));
    } finally {
      setIsRequestingRole(false);
    }
  };

  const displayRole = (role) => {
    switch (role) {
      case 'ADMIN_SISTEMA':
        return t('profile.roleAdminSistema', 'Administrador de Sistema');
      case 'ADMIN_RESTAURANTE':
        return t('profile.roleAdminRestaurante', 'Administrador de Restaurante');
      case 'CLIENTE':
      default:
        return t('profile.roleCliente', 'Cliente');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Premium Header */}
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <SafeAreaView edges={['top', 'left', 'right']}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color="white" />
            <Typography variant="body" color="white">{t('menu.backMenu', 'Volver al Menú')}</Typography>
          </TouchableOpacity>
          <View style={styles.headerProfile}>
            <View style={styles.avatarContainer}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatar} resizeMode="cover" />
              ) : (
                <Ionicons name="person-circle-outline" size={70} color="white" />
              )}
            </View>
            <View style={styles.headerInfo}>
              <Typography variant="h2" color="white" style={styles.userName}>
                {user?.name} {user?.surname}
              </Typography>
              <Typography variant="small" color="rgba(255,255,255,0.8)">
                {user?.email}
              </Typography>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Tab Switcher */}
      <View style={[styles.tabBar, { backgroundColor: cardColor, borderBottomColor: borderColor }]}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'profile' && styles.activeTabButton]}
          onPress={() => setActiveTab('profile')}
        >
          <Ionicons
            name="person-outline"
            size={18}
            color={activeTab === 'profile' ? COLORS.primary : textSecondary}
          />
          <Typography
            variant="bodyBold"
            color={activeTab === 'profile' ? COLORS.primary : textSecondary}
            style={{ marginLeft: 8 }}
          >
            {t('profile.tabProfile', 'Perfil')}
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'security' && styles.activeTabButton]}
          onPress={() => setActiveTab('security')}
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={18}
            color={activeTab === 'security' ? COLORS.primary : textSecondary}
          />
          <Typography
            variant="bodyBold"
            color={activeTab === 'security' ? COLORS.primary : textSecondary}
            style={{ marginLeft: 8 }}
          >
            {t('profile.tabSecurity', 'Seguridad')}
          </Typography>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {activeTab === 'profile' ? (
            /* ==================== DATOS PERSONALES ==================== */
            <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
              <Typography variant="h3" color={textColor} style={styles.cardTitle}>
                {t('profile.tabProfile', 'Datos Personales')}
              </Typography>

              <Input
                label={t('profile.name', 'Nombre')}
                value={name}
                onChangeText={setName}
                placeholder={t('profile.name', 'Nombre')}
                leftIcon={<Ionicons name="person-outline" size={20} color={textSecondary} />}
              />

              <Input
                label={t('profile.surname', 'Apellido')}
                value={surname}
                onChangeText={setSurname}
                placeholder={t('profile.surname', 'Apellido')}
                leftIcon={<Ionicons name="person-outline" size={20} color={textSecondary} />}
              />

              <Input
                label={t('profile.phone', 'Teléfono')}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder={t('profile.phone', 'Teléfono')}
                leftIcon={<Ionicons name="call-outline" size={20} color={textSecondary} />}
              />

              <Input
                label={t('profile.username', 'Nombre de usuario')}
                value={username}
                onChangeText={setUsername}
                placeholder={t('profile.username', 'Nombre de usuario')}
                leftIcon={<Ionicons name="at-outline" size={20} color={textSecondary} />}
              />

              <Input
                label={t('profile.email', 'Correo electrónico')}
                value={user?.email}
                editable={false}
                selectTextOnFocus={false}
                style={{ opacity: 0.7 }}
                leftIcon={<Ionicons name="mail-outline" size={20} color={textSecondary} />}
              />

              <Button
                title={t('profile.saveChanges', 'Guardar Cambios')}
                onPress={handleUpdateProfile}
                loading={isUpdatingProfile}
                style={{ marginTop: 10 }}
              />
            </View>
          ) : (
            /* ==================== SEGURIDAD ==================== */
            <View style={{ gap: 20 }}>
              {/* Cambiar Contraseña */}
              <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
                <Typography variant="h3" color={textColor} style={styles.cardTitle}>
                  {t('profile.passwordSection', 'Cambiar Contraseña')}
                </Typography>

                <Input
                  label={t('profile.currentPassword', 'Contraseña Actual')}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  isPassword
                  placeholder="••••••••"
                  leftIcon={<Ionicons name="lock-closed-outline" size={20} color={textSecondary} />}
                />

                <Input
                  label={t('profile.newPassword', 'Nueva Contraseña')}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  isPassword
                  placeholder="••••••••"
                  leftIcon={<Ionicons name="lock-open-outline" size={20} color={textSecondary} />}
                />

                <Input
                  label={t('profile.confirmNewPassword', 'Confirmar Nueva Contraseña')}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  isPassword
                  placeholder="••••••••"
                  leftIcon={<Ionicons name="shield-outline" size={20} color={textSecondary} />}
                />

                <Button
                  title={t('profile.changePassword', 'Cambiar Contraseña')}
                  onPress={handleChangePassword}
                  loading={isChangingPassword}
                  style={{ marginTop: 10 }}
                />
              </View>

              {/* Solicitar cambio de rol */}
              <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
                <Typography variant="h3" color={textColor} style={styles.cardTitle}>
                  {t('profile.roleSection', 'Solicitud de Cambio de Rol')}
                </Typography>

                <View style={[styles.infoRow, { borderColor }]}>
                  <Typography variant="body" color={textSecondary}>
                    {t('profile.currentRole', 'Rol Actual')}
                  </Typography>
                  <Typography variant="bodyBold" color={COLORS.primary}>
                    {displayRole(user?.roles?.[0] || user?.role)}
                  </Typography>
                </View>

                <Typography variant="bodyBold" color={textColor} style={{ marginTop: 16, marginBottom: 8 }}>
                  {t('profile.requestedRole', 'Selecciona el rol solicitado')}
                </Typography>

                <View style={styles.roleChoices}>
                  <TouchableOpacity
                    style={[
                      styles.roleCard,
                      { backgroundColor: cardColor, borderColor },
                      requestedRole === 'ADMIN_RESTAURANTE' && { borderColor: COLORS.primary, borderWidth: 1.5 },
                    ]}
                    onPress={() => setRequestedRole('ADMIN_RESTAURANTE')}
                  >
                    <Ionicons
                      name="restaurant-outline"
                      size={24}
                      color={requestedRole === 'ADMIN_RESTAURANTE' ? COLORS.primary : textSecondary}
                    />
                    <Typography
                      variant="bodyBold"
                      color={requestedRole === 'ADMIN_RESTAURANTE' ? COLORS.primary : textColor}
                      style={{ marginTop: 6 }}
                    >
                      {t('profile.roleAdminRestauranteShort', 'Admin Restaurante')}
                    </Typography>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.roleCard,
                      { backgroundColor: cardColor, borderColor },
                      requestedRole === 'ADMIN_SISTEMA' && { borderColor: COLORS.primary, borderWidth: 1.5 },
                    ]}
                    onPress={() => setRequestedRole('ADMIN_SISTEMA')}
                  >
                    <Ionicons
                      name="settings-outline"
                      size={24}
                      color={requestedRole === 'ADMIN_SISTEMA' ? COLORS.primary : textSecondary}
                    />
                    <Typography
                      variant="bodyBold"
                      color={requestedRole === 'ADMIN_SISTEMA' ? COLORS.primary : textColor}
                      style={{ marginTop: 6 }}
                    >
                      {t('profile.roleAdminSistemaShort', 'Admin Sistema')}
                    </Typography>
                  </TouchableOpacity>
                </View>

                <Button
                  title={t('profile.requestRole', 'Enviar Solicitud')}
                  onPress={handleRequestRole}
                  loading={isRequestingRole}
                  style={{ marginTop: 20 }}
                />
              </View>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  headerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  tabBar: {
    flexDirection: 'row',
    padding: 6,
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  activeTabButton: {
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    marginBottom: 20,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  roleChoices: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  roleCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
});

export default ProfileScreen;
