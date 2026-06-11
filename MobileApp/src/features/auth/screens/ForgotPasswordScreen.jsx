import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../shared/constants/colors';
import { forgotPassword } from '../../../api/auth';


const ForgotPasswordScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleResetPassword = async () => {
        // Campo vacío
        if (!email.trim()) {
            setError('Por favor, ingresa tu correo electrónico.');
            return;
        }

        //  Formato de correo electrónico válido
        const emailRegex = /\S+@\S+\.\S+/;
        if (!emailRegex.test(email)) {
            setError('Por favor, ingresa un correo válido (ej: tu@correo.com).');
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
                    {/* Botón de Regreso (Estilo del primer diseño) */}
                    <View style={styles.containerReturnButton}>
                        <TouchableOpacity style={styles.returnButton} onPress={() => navigation?.goBack()}>
                            <Ionicons name="arrow-back" size={30} color={COLORS.primary} />
                            <Text style={styles.returnButtonText}>Volver</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.containerMain}>
                        {/* Icono agregado del segundo diseño */}
                        <View style={styles.iconContainer}>
                            <Ionicons name="lock-open" size={50} color={COLORS.white || 'white'} />
                        </View>

                        <View style={styles.containerInfo}>
                            <Text style={styles.title}>Recuperar Contraseña</Text>
                            <Text style={styles.parragraph}>Ingrese tu correo y te enviaremos instrucciones para restablecer tu contraseña.</Text>
                        </View>

                        <View style={styles.containerInput}>
                            <Text style={styles.textInputLabel}>Correo Electrónico</Text>
                            <TextInput
                                style={[styles.input, error ? styles.inputError : null]}
                                placeholder="tu@correo.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={(text) => {
                                    setEmail(text);
                                    if (error) setError(''); // Limpia el error mientras el usuario escribe
                                }}
                            />
                            {/* Mensaje de error visual */}
                            {error ? <Text style={styles.errorText}>{error}</Text> : null}
                        </View>

                        <View style={styles.containerButton}>
                            <TouchableOpacity
                                style={[styles.button, loading && styles.disabledButton]}
                                onPress={handleResetPassword}
                                disabled={loading}
                            >
                                <Text style={styles.buttonText}>
                                    {loading ? 'Enviando...' : 'Enviar Correo'}
                                </Text>
                            </TouchableOpacity>
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
        backgroundColor: COLORS.white || '#FFFFFF',
    },
    scrollViewContent: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    containerReturnButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
    },
    returnButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    returnButtonText: {
        color: COLORS.primary,
        fontSize: 16,
        marginLeft: 5,
    },
    containerMain: {
        width: '100%',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 60,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    containerInfo: {
        width: '100%',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        textAlign: 'center',
        paddingBottom: 10,
        color: COLORS.text,
    },
    parragraph: {
        fontSize: 14,
        textAlign: 'center',
        color: COLORS.text,
        opacity: 0.6,
        lineHeight: 22,
    },
    containerInput: {
        width: '100%',
        paddingHorizontal: 20,
    },
    textInputLabel: {
        fontSize: 16,
        marginBottom: 5,
        color: COLORS.text,
        fontWeight: 'bold',
    },
    input: {
        backgroundColor: COLORS.white || '#FFFFFF',
        borderWidth: 1,
        borderColor: COLORS.border || '#CCCCCC',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        height: 50,
        width: '100%',
    },
    inputError: {
        borderColor: 'red',
        borderWidth: 1.5,
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 5,
        marginLeft: 5,
    },
    containerButton: {
        width: '100%',
        paddingHorizontal: 20,
        marginTop: 30,
    },
    button: {
        backgroundColor: COLORS.primary,
        borderRadius: 10,
        paddingVertical: 15,
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    disabledButton: {
        opacity: 0.6,
    },
    buttonText: {
        color: COLORS.white || '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    }
});

export default ForgotPasswordScreen;