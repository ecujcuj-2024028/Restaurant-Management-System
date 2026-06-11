import React, { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { COLORS } from '../../../shared/constants/colors';
import { forgotPassword } from '../../../api/auth';

// Common Components
import Button from '../../../shared/components/common/Button';
import Input from '../../../shared/components/common/Input';
import Typography from '../../../shared/components/common/Typography';

const ForgotPasswordScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleResetPassword = async () => {
        if (!email.trim()) {
            setError('Por favor, ingresa tu correo electrónico.');
            return;
        }

        const emailRegex = /\S+@\S+\.\S+/;
        if (!emailRegex.test(email)) {
            setError('Por favor, ingresa un correo válido.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await forgotPassword(email);
            setLoading(false);
            Alert.alert(
                'Correo enviado',
                'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.',
                [{ text: 'OK', onPress: () => navigation?.goBack() }]
            );
        } catch (err) {
            setLoading(false);
            const errorMsg = err.response?.data?.message || err.message || 'Error al conectar con el servidor';
            Alert.alert('Error', errorMsg);
        }
    };


    return (
        <KeyboardAvoidingView
            style={styles.flexContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollViewContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.container}>
                    <View style={styles.containerReturnButton}>
                        <TouchableOpacity style={styles.returnButton} onPress={() => navigation?.goBack()}>
                            <FontAwesome6 name="arrow-left" size={20} color={COLORS.primary} />
                            <Typography variant="bodyBold" color={COLORS.primary} style={{ marginLeft: 10 }}>Volver</Typography>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.containerMain}>
                        <View style={styles.iconContainer}>
                            <FontAwesome6 name="lock-open" size={40} color="white" />
                        </View>

                        <View style={styles.containerInfo}>
                            <Typography variant="h2" style={{ textAlign: 'center', marginBottom: 10 }}>Recuperar Contraseña</Typography>
                            <Typography variant="caption" style={{ textAlign: 'center' }}>
                                Ingresa tu correo y te enviaremos instrucciones para restablecer tu contraseña.
                            </Typography>
                        </View>

                        <View style={styles.containerInput}>
                            <Input
                                label="Correo Electrónico"
                                placeholder="tu@correo.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                error={error}
                                onChangeText={(text) => {
                                    setEmail(text);
                                    if (error) setError('');
                                }}
                                leftIcon={<FontAwesome6 name="envelope" size={18} color={COLORS.textSecondary} />}
                            />
                        </View>

                        <View style={styles.containerButton}>
                            <Button
                                title="Enviar Correo"
                                onPress={handleResetPassword}
                                loading={loading}
                                style={styles.button}
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    flexContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollViewContent: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
    },
    containerReturnButton: {
        marginTop: 50,
        marginLeft: 20,
    },
    returnButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    containerMain: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    containerInfo: {
        marginBottom: 30,
    },
    containerInput: {
        width: '100%',
    },
    containerButton: {
        width: '100%',
        marginTop: 10,
    },
});

export default ForgotPasswordScreen;
