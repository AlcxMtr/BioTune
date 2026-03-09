import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Dimensions,
  TouchableOpacity,
  ImageBackground,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { fonts, colors } from '../../styles';
import { TextInput, Button } from '../../components';

const { width } = Dimensions.get('window');
const ROLES = ['Patient', 'Caregiver', 'Doctor'];

export default function AuthView({ onSetAccountType, onAuthSuccess }) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [formState, setFormState] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const goBack = () => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  };

  const selectRole = (role) => {
    onSetAccountType(role.toLowerCase());
    Animated.spring(slideAnim, {
      toValue: -width,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  };

  const handleAuth = async () => {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const auth = getAuth();
      let credential;
      if (formState === 'login') {
        credential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        credential = await createUserWithEmailAndPassword(auth, email, password);
      }
      onAuthSuccess(credential.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../../assets/images/background.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Logo – always visible */}
        <View style={styles.logoContainer}>
          <Animated.Image
            resizeMode="contain"
            style={styles.logo}
            source={require('../../../assets/images/white-logo.png')}
          />
        </View>

        {/* Sliding card area */}
        <View style={styles.cardOuter}>
          <Animated.View
            style={[styles.cardSlider, { transform: [{ translateX: slideAnim }] }]}
          >
            {/* Panel 1 – Role selection */}
            <View style={styles.panel}>
              <Text style={styles.heading}>I am a…</Text>
              {ROLES.map((role) => (
                <TouchableOpacity
                  key={role}
                  style={styles.roleButton}
                  onPress={() => selectRole(role)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.roleButtonText}>{role}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Panel 2 – Email + password */}
            <ScrollView
              style={styles.panel}
              contentContainerStyle={styles.formScroll}
              keyboardShouldPersistTaps="handled"
            >
              <TouchableOpacity onPress={goBack} style={styles.backButton}>
                <Icon name="arrow-left" size={18} color={colors.white} />
              </TouchableOpacity>
              <Text style={styles.heading}>
                {formState === 'login' ? 'Sign In' : 'Create Account'}
              </Text>

              <TextInput
                placeholder="Email"
                style={styles.textInput}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                placeholder="Password"
                secureTextEntry
                style={styles.textInput}
                value={password}
                onChangeText={setPassword}
              />

              {!!error && <Text style={styles.error}>{error}</Text>}

              <Button
                bgColor="white"
                textColor={colors.primary}
                secondary
                rounded
                style={styles.authButton}
                caption={loading ? 'Please wait…' : formState === 'login' ? 'Sign In' : 'Register'}
                onPress={handleAuth}
              />

              <TouchableOpacity
                onPress={() =>
                  setFormState(formState === 'login' ? 'register' : 'login')
                }
                style={styles.toggleRow}
              >
                <Text style={styles.toggleText}>
                  {formState === 'login'
                    ? "Don't have an account?"
                    : 'Already have an account?'}
                </Text>
                <Text style={[styles.toggleText, styles.toggleBold]}>
                  {formState === 'login' ? 'Register' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  screen: {
    flex: 1,
    alignItems: 'center',
  },
  logoContainer: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    maxHeight: 180,
    paddingTop: 40,
  },
  logo: {
    height: 120,
    width: 200,
  },
  // Clipping wrapper — only the card area slides
  cardOuter: {
    flex: 2,
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  cardSlider: {
    flex: 1,
    flexDirection: 'row',
    width: width * 2,
  },
  panel: {
    width: width,
    flex: 1,
    paddingHorizontal: 30,
  },
  formScroll: {
    flexGrow: 1,
    paddingBottom: 30,
    paddingTop: 10,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 8,
  },
  heading: {
    fontSize: 24,
    fontFamily: fonts.primaryBold,
    color: colors.white,
    marginBottom: 24,
    textAlign: 'center',
  },
  roleButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1.5,
    borderColor: colors.white,
    borderRadius: 30,
    paddingVertical: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  roleButtonText: {
    color: colors.white,
    fontSize: 17,
    fontFamily: fonts.primaryBold,
    letterSpacing: 0.5,
  },
  textInput: {
    alignSelf: 'stretch',
    marginTop: 16,
  },
  authButton: {
    alignSelf: 'stretch',
    marginTop: 24,
    height: 50,
  },
  error: {
    color: '#FF6B6B',
    marginTop: 12,
    fontFamily: fonts.primaryRegular,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  toggleText: {
    color: colors.white,
    fontFamily: fonts.primaryRegular,
    fontSize: 14,
  },
  toggleBold: {
    fontFamily: fonts.primaryBold,
    marginLeft: 5,
  },
});

