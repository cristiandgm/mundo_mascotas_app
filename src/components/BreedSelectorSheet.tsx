import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import {
  PetActivityType,
  PetSensitivityType,
} from '../context/AuthContext';
import { useDraggableSheet } from '../utils/useDraggableSheet';

export type BreedSizeFilter =
  | 'all'
  | 'criollo'
  | 'pequeno'
  | 'mediano'
  | 'grande'
  | 'gigante'
  | 'pelo_corto'
  | 'pelo_largo'
  | 'exotico';

export interface PetBreedOption {
  id: string;
  name: string;
  species: 'dog' | 'cat';
  category: BreedSizeFilter;
  categoryLabel: string;
  emoji: string;
  avgWeightKg: number;
  puppyWeightKg: number;
  defaultActivity: PetActivityType;
  defaultSensitivity: PetSensitivityType;
  bioTrait: string;
}

export const PET_BREEDS_CATALOG: PetBreedOption[] = [
  // ==================== PERROS: CRIOLLOS / MESTIZOS ====================
  {
    id: 'dog_criollo_mediano',
    name: 'Criollo / Mestizo Mediano',
    species: 'dog',
    category: 'criollo',
    categoryLabel: 'Criollo Colombiano',
    emoji: '🐕',
    avgWeightKg: 16,
    puppyWeightKg: 6,
    defaultActivity: 'moderate',
    defaultSensitivity: 'none',
    bioTrait: 'Genética fuerte · Nutrición balanceada',
  },
  {
    id: 'dog_criollo_pequeno',
    name: 'Criollo / Mestizo Pequeño',
    species: 'dog',
    category: 'criollo',
    categoryLabel: 'Criollo Pequeño',
    emoji: '🐶',
    avgWeightKg: 8,
    puppyWeightKg: 3,
    defaultActivity: 'moderate',
    defaultSensitivity: 'none',
    bioTrait: 'Metabolismo rápido · Croqueta digestible',
  },
  {
    id: 'dog_criollo_grande',
    name: 'Criollo / Mestizo Grande',
    species: 'dog',
    category: 'criollo',
    categoryLabel: 'Criollo Grande',
    emoji: '🐕‍🦺',
    avgWeightKg: 26,
    puppyWeightKg: 10,
    defaultActivity: 'high',
    defaultSensitivity: 'none',
    bioTrait: 'Soporte articular y muscular diario',
  },

  // ==================== PERROS: RAZAS PEQUEÑAS & MINI (< 10 KG) ====================
  {
    id: 'dog_french_bulldog',
    name: 'Bulldog Francés',
    species: 'dog',
    category: 'pequeno',
    categoryLabel: 'Raza Pequeña / Moloso',
    emoji: '🐾',
    avgWeightKg: 11,
    puppyWeightKg: 4.5,
    defaultActivity: 'low',
    defaultSensitivity: 'skin',
    bioTrait: 'Piel sensible y digestión delicada · Omega 3 & 6',
  },
  {
    id: 'dog_pug',
    name: 'Pug (Carlino)',
    species: 'dog',
    category: 'pequeno',
    categoryLabel: 'Raza Pequeña',
    emoji: '🐶',
    avgWeightKg: 8,
    puppyWeightKg: 3,
    defaultActivity: 'low',
    defaultSensitivity: 'weight',
    bioTrait: 'Tendencia a sobrepeso y pliegues cutáneos',
  },
  {
    id: 'dog_schnauzer_mini',
    name: 'Schnauzer Miniatura',
    species: 'dog',
    category: 'pequeno',
    categoryLabel: 'Raza Pequeña',
    emoji: '🧔',
    avgWeightKg: 7.5,
    puppyWeightKg: 3,
    defaultActivity: 'moderate',
    defaultSensitivity: 'skin',
    bioTrait: 'Cuidado de pelaje y control lipídico',
  },
  {
    id: 'dog_pomerania',
    name: 'Pomerania (Lulú)',
    species: 'dog',
    category: 'pequeno',
    categoryLabel: 'Raza Mini',
    emoji: '🦊',
    avgWeightKg: 3,
    puppyWeightKg: 1.5,
    defaultActivity: 'moderate',
    defaultSensitivity: 'skin',
    bioTrait: 'Doble manto abundante · Rico en Salmón y Biotina',
  },
  {
    id: 'dog_yorkshire',
    name: 'Yorkshire Terrier',
    species: 'dog',
    category: 'pequeno',
    categoryLabel: 'Raza Mini',
    emoji: '🎀',
    avgWeightKg: 3.2,
    puppyWeightKg: 1.5,
    defaultActivity: 'moderate',
    defaultSensitivity: 'skin',
    bioTrait: 'Pelaje sedoso continuo · Salud dental',
  },
  {
    id: 'dog_shih_tzu',
    name: 'Shih Tzu',
    species: 'dog',
    category: 'pequeno',
    categoryLabel: 'Raza Pequeña',
    emoji: '🐶',
    avgWeightKg: 6.5,
    puppyWeightKg: 2.5,
    defaultActivity: 'low',
    defaultSensitivity: 'skin',
    bioTrait: 'Manto largo hipoalergénico · Omega 3 & 6',
  },
  {
    id: 'dog_chihuahua',
    name: 'Chihuahua',
    species: 'dog',
    category: 'pequeno',
    categoryLabel: 'Raza Mini',
    emoji: '🐕',
    avgWeightKg: 2.5,
    puppyWeightKg: 1.2,
    defaultActivity: 'moderate',
    defaultSensitivity: 'none',
    bioTrait: 'Alta densidad energética en raciones pequeñas',
  },
  {
    id: 'dog_poodle_mini',
    name: 'French Poodle / Caniche Toy & Mini',
    species: 'dog',
    category: 'pequeno',
    categoryLabel: 'Raza Pequeña',
    emoji: '🐩',
    avgWeightKg: 5.5,
    puppyWeightKg: 2.2,
    defaultActivity: 'moderate',
    defaultSensitivity: 'skin',
    bioTrait: 'Rizo denso · Nutrición para piel y longevidad',
  },
  {
    id: 'dog_bichon_maltes',
    name: 'Bichón Maltés',
    species: 'dog',
    category: 'pequeno',
    categoryLabel: 'Raza Pequeña',
    emoji: '☁️',
    avgWeightKg: 4,
    puppyWeightKg: 1.8,
    defaultActivity: 'low',
    defaultSensitivity: 'skin',
    bioTrait: 'Manto blanco puro · Proteínas limpias sin alérgenos',
  },
  {
    id: 'dog_bichon_frise',
    name: 'Bichón Frisé / Habanero',
    species: 'dog',
    category: 'pequeno',
    categoryLabel: 'Raza Pequeña',
    emoji: '🐩',
    avgWeightKg: 5.5,
    puppyWeightKg: 2.2,
    defaultActivity: 'moderate',
    defaultSensitivity: 'skin',
    bioTrait: 'Piel sensible · Ácidos grasos esenciales',
  },
  {
    id: 'dog_dachshund',
    name: 'Teckel / Perro Salchicha (Dachshund)',
    species: 'dog',
    category: 'pequeno',
    categoryLabel: 'Raza Pequeña',
    emoji: '🌭',
    avgWeightKg: 7.5,
    puppyWeightKg: 3,
    defaultActivity: 'moderate',
    defaultSensitivity: 'weight',
    bioTrait: 'Control estricto de peso para cuidar su columna',
  },
  {
    id: 'dog_jack_russell',
    name: 'Jack Russell Terrier',
    species: 'dog',
    category: 'pequeno',
    categoryLabel: 'Raza Pequeña Activa',
    emoji: '⚡',
    avgWeightKg: 7,
    puppyWeightKg: 3,
    defaultActivity: 'high',
    defaultSensitivity: 'grain_free',
    bioTrait: 'Energía explosiva · Alta proteína animal',
  },
  {
    id: 'dog_pinscher',
    name: 'Pinscher Miniatura',
    species: 'dog',
    category: 'pequeno',
    categoryLabel: 'Raza Mini',
    emoji: '🐕',
    avgWeightKg: 4.5,
    puppyWeightKg: 2,
    defaultActivity: 'high',
    defaultSensitivity: 'none',
    bioTrait: 'Metabolismo activo · Músculo magro',
  },
  {
    id: 'dog_westie',
    name: 'West Highland White Terrier (Westie)',
    species: 'dog',
    category: 'pequeno',
    categoryLabel: 'Raza Pequeña',
    emoji: '🐾',
    avgWeightKg: 8,
    puppyWeightKg: 3.5,
    defaultActivity: 'moderate',
    defaultSensitivity: 'skin',
    bioTrait: 'Tendencia dermatológica · Salmón y probióticos',
  },
  {
    id: 'dog_boston_terrier',
    name: 'Boston Terrier',
    species: 'dog',
    category: 'pequeno',
    categoryLabel: 'Raza Pequeña',
    emoji: '🐶',
    avgWeightKg: 8.5,
    puppyWeightKg: 3.5,
    defaultActivity: 'moderate',
    defaultSensitivity: 'none',
    bioTrait: 'Digestión suave con probióticos K9 Strain®',
  },
  {
    id: 'dog_cavalier',
    name: 'Cavalier King Charles Spaniel',
    species: 'dog',
    category: 'pequeno',
    categoryLabel: 'Raza Pequeña',
    emoji: '🐶',
    avgWeightKg: 7,
    puppyWeightKg: 3,
    defaultActivity: 'low',
    defaultSensitivity: 'skin',
    bioTrait: 'Salud cardíaca (Taurina) y pelaje sedoso',
  },
  {
    id: 'dog_papillon',
    name: 'Papillón / Spaniel Continental',
    species: 'dog',
    category: 'pequeno',
    categoryLabel: 'Raza Mini',
    emoji: '🦋',
    avgWeightKg: 4,
    puppyWeightKg: 1.8,
    defaultActivity: 'moderate',
    defaultSensitivity: 'none',
    bioTrait: 'Alta vitalidad y fácil digestión',
  },
  {
    id: 'dog_pequines',
    name: 'Pequinés / Lhasa Apso',
    species: 'dog',
    category: 'pequeno',
    categoryLabel: 'Raza Pequeña',
    emoji: '🦁',
    avgWeightKg: 6,
    puppyWeightKg: 2.5,
    defaultActivity: 'low',
    defaultSensitivity: 'skin',
    bioTrait: 'Cuidado dérmico y control calórico',
  },

  // ==================== PERROS: RAZAS MEDIANAS (10 A 25 KG) ====================
  {
    id: 'dog_beagle',
    name: 'Beagle',
    species: 'dog',
    category: 'mediano',
    categoryLabel: 'Raza Mediana',
    emoji: '🐶',
    avgWeightKg: 13,
    puppyWeightKg: 5,
    defaultActivity: 'moderate',
    defaultSensitivity: 'weight',
    bioTrait: 'Apetito voraz · Requiere fibra saciante y control peso',
  },
  {
    id: 'dog_english_bulldog',
    name: 'Bulldog Inglés',
    species: 'dog',
    category: 'mediano',
    categoryLabel: 'Raza Mediana Moloso',
    emoji: '🐾',
    avgWeightKg: 23,
    puppyWeightKg: 9,
    defaultActivity: 'low',
    defaultSensitivity: 'skin',
    bioTrait: 'Cuidado articular, pliegues de piel y control de peso',
  },
  {
    id: 'dog_border_collie',
    name: 'Border Collie',
    species: 'dog',
    category: 'mediano',
    categoryLabel: 'Raza Mediana Pastoreo',
    emoji: '⚡',
    avgWeightKg: 19,
    puppyWeightKg: 7.5,
    defaultActivity: 'high',
    defaultSensitivity: 'grain_free',
    bioTrait: 'Atleta de alto rendimiento · Proteína ancestral',
  },
  {
    id: 'dog_cocker_spaniel',
    name: 'Cocker Spaniel (Inglés / Americano)',
    species: 'dog',
    category: 'mediano',
    categoryLabel: 'Raza Mediana',
    emoji: '🐶',
    avgWeightKg: 13.5,
    puppyWeightKg: 5,
    defaultActivity: 'moderate',
    defaultSensitivity: 'skin',
    bioTrait: 'Orejas largas y manto brillante · Omega 3 & 6',
  },
  {
    id: 'dog_australian_shepherd',
    name: 'Pastor Australiano (Aussie)',
    species: 'dog',
    category: 'mediano',
    categoryLabel: 'Raza Mediana Pastoreo',
    emoji: '🐕',
    avgWeightKg: 22,
    puppyWeightKg: 8.5,
    defaultActivity: 'high',
    defaultSensitivity: 'grain_free',
    bioTrait: 'Alta demanda proteica y ácidos grasos para el manto',
  },
  {
    id: 'dog_pitbull_bully',
    name: 'American Pitbull Terrier / American Bully',
    species: 'dog',
    category: 'mediano',
    categoryLabel: 'Raza Muscular',
    emoji: '💪',
    avgWeightKg: 25,
    puppyWeightKg: 10,
    defaultActivity: 'high',
    defaultSensitivity: 'grain_free',
    bioTrait: 'Definición muscular magra (70-85% proteína) y piel sana',
  },
  {
    id: 'dog_staffordshire',
    name: 'Staffordshire Bull Terrier / Amstaff',
    species: 'dog',
    category: 'mediano',
    categoryLabel: 'Raza Muscular',
    emoji: '🐕',
    avgWeightKg: 22,
    puppyWeightKg: 8.5,
    defaultActivity: 'high',
    defaultSensitivity: 'skin',
    bioTrait: 'Potencia muscular y sensibilidad cutánea',
  },
  {
    id: 'dog_bull_terrier',
    name: 'Bull Terrier Inglés',
    species: 'dog',
    category: 'mediano',
    categoryLabel: 'Raza Mediana',
    emoji: '🐾',
    avgWeightKg: 24,
    puppyWeightKg: 9,
    defaultActivity: 'high',
    defaultSensitivity: 'skin',
    bioTrait: 'Manto blanco delicado · Proteína de Salmón o Cordero',
  },
  {
    id: 'dog_husky',
    name: 'Husky Siberiano',
    species: 'dog',
    category: 'mediano',
    categoryLabel: 'Raza Nórdica',
    emoji: '🐺',
    avgWeightKg: 23,
    puppyWeightKg: 9,
    defaultActivity: 'high',
    defaultSensitivity: 'grain_free',
    bioTrait: 'ADN ancestral ártico · Ideal Taste of the Wild / Acana',
  },
  {
    id: 'dog_samoyedo',
    name: 'Samoyedo',
    species: 'dog',
    category: 'mediano',
    categoryLabel: 'Raza Nórdica',
    emoji: '🐻‍❄️',
    avgWeightKg: 22,
    puppyWeightKg: 8.5,
    defaultActivity: 'moderate',
    defaultSensitivity: 'skin',
    bioTrait: 'Doble manto polar · Requiere alto Omega 3 de Salmón',
  },
  {
    id: 'dog_chow_chow',
    name: 'Chow Chow',
    species: 'dog',
    category: 'mediano',
    categoryLabel: 'Raza Mediana',
    emoji: '🦁',
    avgWeightKg: 25,
    puppyWeightKg: 10,
    defaultActivity: 'low',
    defaultSensitivity: 'skin',
    bioTrait: 'Piel y pelaje ultra denso · Proteína hipoalergénica',
  },
  {
    id: 'dog_shar_pei',
    name: 'Shar Pei',
    species: 'dog',
    category: 'mediano',
    categoryLabel: 'Raza Mediana',
    emoji: '🐶',
    avgWeightKg: 22,
    puppyWeightKg: 8.5,
    defaultActivity: 'low',
    defaultSensitivity: 'skin',
    bioTrait: 'Cuidado intensivo de pliegues dérmicos · Salmón o Cordero',
  },
  {
    id: 'dog_shiba_inu',
    name: 'Shiba Inu',
    species: 'dog',
    category: 'mediano',
    categoryLabel: 'Raza Mediana',
    emoji: '🦊',
    avgWeightKg: 10.5,
    puppyWeightKg: 4,
    defaultActivity: 'moderate',
    defaultSensitivity: 'skin',
    bioTrait: 'Pelaje afelpado · Libre de alérgenos comunes',
  },
  {
    id: 'dog_corgi',
    name: 'Welsh Corgi Pembroke',
    species: 'dog',
    category: 'mediano',
    categoryLabel: 'Raza Mediana',
    emoji: '🦊',
    avgWeightKg: 12,
    puppyWeightKg: 4.5,
    defaultActivity: 'moderate',
    defaultSensitivity: 'weight',
    bioTrait: 'Cuidado de espalda y control de peso saludable',
  },
  {
    id: 'dog_basset_hound',
    name: 'Basset Hound',
    species: 'dog',
    category: 'mediano',
    categoryLabel: 'Raza Mediana',
    emoji: '🐶',
    avgWeightKg: 24,
    puppyWeightKg: 9,
    defaultActivity: 'low',
    defaultSensitivity: 'weight',
    bioTrait: 'Metabolismo tranquilo · Control calórico y articular',
  },
  {
    id: 'dog_schnauzer_estandar',
    name: 'Schnauzer Estándar / Gigante',
    species: 'dog',
    category: 'mediano',
    categoryLabel: 'Raza Mediana / Grande',
    emoji: '🧔',
    avgWeightKg: 20,
    puppyWeightKg: 8,
    defaultActivity: 'high',
    defaultSensitivity: 'none',
    bioTrait: 'Músculo firme y salud digestiva',
  },

  // ==================== PERROS: RAZAS GRANDES (25 A 40 KG) ====================
  {
    id: 'dog_golden_retriever',
    name: 'Golden Retriever',
    species: 'dog',
    category: 'grande',
    categoryLabel: 'Raza Grande',
    emoji: '🦮',
    avgWeightKg: 29,
    puppyWeightKg: 12,
    defaultActivity: 'moderate',
    defaultSensitivity: 'skin',
    bioTrait: 'Manto dorado y articulaciones · Cordero o Salmón',
  },
  {
    id: 'dog_labrador',
    name: 'Labrador Retriever',
    species: 'dog',
    category: 'grande',
    categoryLabel: 'Raza Grande',
    emoji: '🐕‍🦺',
    avgWeightKg: 30,
    puppyWeightKg: 12,
    defaultActivity: 'moderate',
    defaultSensitivity: 'weight',
    bioTrait: 'Control de saciedad y soporte condroprotector',
  },
  {
    id: 'dog_pastor_aleman',
    name: 'Pastor Alemán (Ovejero)',
    species: 'dog',
    category: 'grande',
    categoryLabel: 'Raza Grande Guardia',
    emoji: '🐺',
    avgWeightKg: 34,
    puppyWeightKg: 14,
    defaultActivity: 'high',
    defaultSensitivity: 'none',
    bioTrait: 'Digestión sensible y cuidado de cadera · Probióticos vivos',
  },
  {
    id: 'dog_pastor_belga',
    name: 'Pastor Belga Malinois / Tervueren',
    species: 'dog',
    category: 'grande',
    categoryLabel: 'Raza Grande Trabajo',
    emoji: '⚡',
    avgWeightKg: 28,
    puppyWeightKg: 11,
    defaultActivity: 'high',
    defaultSensitivity: 'grain_free',
    bioTrait: ' Desempeño atlético extremo · Alta proteína biológica',
  },
  {
    id: 'dog_boxer',
    name: 'Boxer',
    species: 'dog',
    category: 'grande',
    categoryLabel: 'Raza Grande',
    emoji: '🐕',
    avgWeightKg: 29,
    puppyWeightKg: 11,
    defaultActivity: 'high',
    defaultSensitivity: 'none',
    bioTrait: 'Corazón fuerte (L-Carnitina & Taurina) y masa muscular',
  },
  {
    id: 'dog_doberman',
    name: 'Doberman',
    species: 'dog',
    category: 'grande',
    categoryLabel: 'Raza Grande Guardia',
    emoji: '🐕‍🦺',
    avgWeightKg: 35,
    puppyWeightKg: 13,
    defaultActivity: 'high',
    defaultSensitivity: 'grain_free',
    bioTrait: 'Atleta esbelto · Alta densidad proteica y brillo en pelaje',
  },
  {
    id: 'dog_dalmata',
    name: 'Dálmata',
    species: 'dog',
    category: 'grande',
    categoryLabel: 'Raza Grande',
    emoji: '🐾',
    avgWeightKg: 27,
    puppyWeightKg: 10,
    defaultActivity: 'high',
    defaultSensitivity: 'none',
    bioTrait: 'Proteínas nobles de alta digestibilidad (Cordero & Arroz)',
  },
  {
    id: 'dog_weimaraner',
    name: 'Weimaraner (Braco de Weimar)',
    species: 'dog',
    category: 'grande',
    categoryLabel: 'Raza Grande',
    emoji: '🐕',
    avgWeightKg: 32,
    puppyWeightKg: 12,
    defaultActivity: 'high',
    defaultSensitivity: 'grain_free',
    bioTrait: 'Alta quema calórica · Bisonte, Venado o Pollo de corral',
  },
  {
    id: 'dog_vizsla',
    name: 'Vizsla / Braco Húngaro & Pointer',
    species: 'dog',
    category: 'grande',
    categoryLabel: 'Raza Grande',
    emoji: '🐕',
    avgWeightKg: 26,
    puppyWeightKg: 10,
    defaultActivity: 'high',
    defaultSensitivity: 'grain_free',
    bioTrait: 'Resistencia aeróbica · Nutrición ancestral',
  },
  {
    id: 'dog_collie',
    name: 'Rough Collie / Pastor Escocés (Lassie)',
    species: 'dog',
    category: 'grande',
    categoryLabel: 'Raza Grande',
    emoji: '🐕',
    avgWeightKg: 27,
    puppyWeightKg: 10,
    defaultActivity: 'moderate',
    defaultSensitivity: 'skin',
    bioTrait: 'Manto abundante · Ácidos grasos Omega 3 y 6',
  },
  {
    id: 'dog_old_english',
    name: 'Viejo Pastor Inglés (Bobtail)',
    species: 'dog',
    category: 'grande',
    categoryLabel: 'Raza Grande',
    emoji: '🐻',
    avgWeightKg: 34,
    puppyWeightKg: 13,
    defaultActivity: 'moderate',
    defaultSensitivity: 'skin',
    bioTrait: 'Pelaje denso y articulaciones fuertes',
  },
  {
    id: 'dog_akita',
    name: 'Akita Inu / Akita Americano',
    species: 'dog',
    category: 'grande',
    categoryLabel: 'Raza Grande',
    emoji: '🦊',
    avgWeightKg: 38,
    puppyWeightKg: 15,
    defaultActivity: 'moderate',
    defaultSensitivity: 'skin',
    bioTrait: 'Sensibilidad cutánea · Excelente con Salmón Salvaje',
  },
  {
    id: 'dog_alaskan_malamute',
    name: 'Alaskan Malamute',
    species: 'dog',
    category: 'grande',
    categoryLabel: 'Raza Nórdica Grande',
    emoji: '🐺',
    avgWeightKg: 38,
    puppyWeightKg: 15,
    defaultActivity: 'high',
    defaultSensitivity: 'grain_free',
    bioTrait: 'Dieta ancestral rica en carnes asadas y pescado',
  },
  {
    id: 'dog_rhodesian',
    name: 'Rhodesian Ridgeback',
    species: 'dog',
    category: 'grande',
    categoryLabel: 'Raza Grande',
    emoji: '🐕',
    avgWeightKg: 36,
    puppyWeightKg: 14,
    defaultActivity: 'high',
    defaultSensitivity: 'grain_free',
    bioTrait: 'Musculatura atlética y articulaciones protegidas',
  },

  // ==================== PERROS: RAZAS GIGANTES (+40 KG) ====================
  {
    id: 'dog_rottweiler',
    name: 'Rottweiler',
    species: 'dog',
    category: 'gigante',
    categoryLabel: 'Raza Grande / Gigante',
    emoji: '🛡️',
    avgWeightKg: 45,
    puppyWeightKg: 18,
    defaultActivity: 'moderate',
    defaultSensitivity: 'none',
    bioTrait: 'Potencia muscular y soporte articular pesado',
  },
  {
    id: 'dog_bernes',
    name: 'Bernés de la Montaña (Boyero de Berna)',
    species: 'dog',
    category: 'gigante',
    categoryLabel: 'Raza Gigante',
    emoji: '🏔️',
    avgWeightKg: 44,
    puppyWeightKg: 18,
    defaultActivity: 'moderate',
    defaultSensitivity: 'skin',
    bioTrait: 'Manto tricolor largo y cuidado de articulaciones',
  },
  {
    id: 'dog_cane_corso',
    name: 'Cane Corso (Mastín Italiano)',
    species: 'dog',
    category: 'gigante',
    categoryLabel: 'Raza Gigante Moloso',
    emoji: '🛡️',
    avgWeightKg: 45,
    puppyWeightKg: 18,
    defaultActivity: 'moderate',
    defaultSensitivity: 'grain_free',
    bioTrait: 'Estructura ósea masiva · Alta inclusión cárnica',
  },
  {
    id: 'dog_gran_danes',
    name: 'Gran Danés (Dogo Alemán)',
    species: 'dog',
    category: 'gigante',
    categoryLabel: 'Raza Gigante',
    emoji: '👑',
    avgWeightKg: 54,
    puppyWeightKg: 22,
    defaultActivity: 'moderate',
    defaultSensitivity: 'none',
    bioTrait: 'Digestión delicada y máxima protección osteoarticular',
  },
  {
    id: 'dog_san_bernardo',
    name: 'San Bernardo',
    species: 'dog',
    category: 'gigante',
    categoryLabel: 'Raza Gigante',
    emoji: '🏔️',
    avgWeightKg: 60,
    puppyWeightKg: 24,
    defaultActivity: 'low',
    defaultSensitivity: 'weight',
    bioTrait: 'Control de peso articular y glucosamina natural',
  },
  {
    id: 'dog_dogo_argentino',
    name: 'Dogo Argentino / Dogo de Burdeos',
    species: 'dog',
    category: 'gigante',
    categoryLabel: 'Raza Gigante',
    emoji: '💪',
    avgWeightKg: 43,
    puppyWeightKg: 17,
    defaultActivity: 'high',
    defaultSensitivity: 'skin',
    bioTrait: 'Manto blanco / piel sensible + alta proteína muscular',
  },
  {
    id: 'dog_terranova',
    name: 'Terranova / Mastín Napolitano / Fila',
    species: 'dog',
    category: 'gigante',
    categoryLabel: 'Raza Gigante',
    emoji: '🐻',
    avgWeightKg: 52,
    puppyWeightKg: 20,
    defaultActivity: 'low',
    defaultSensitivity: 'none',
    bioTrait: 'Soporte articular y digestibilidad superior',
  },

  // ==================== GATOS: CRIOLLOS / DOMÉSTICOS ====================
  {
    id: 'cat_criollo_corto',
    name: 'Criollo / Doméstico Pelo Corto',
    species: 'cat',
    category: 'criollo',
    categoryLabel: 'Criollo Felino',
    emoji: '🐱',
    avgWeightKg: 4.5,
    puppyWeightKg: 1.8,
    defaultActivity: 'moderate',
    defaultSensitivity: 'none',
    bioTrait: 'Vitalidad felina, taurina y salud urinaria',
  },
  {
    id: 'cat_criollo_largo',
    name: 'Criollo / Doméstico Pelo Largo',
    species: 'cat',
    category: 'criollo',
    categoryLabel: 'Criollo Pelo Largo',
    emoji: '🐈',
    avgWeightKg: 4.8,
    puppyWeightKg: 1.8,
    defaultActivity: 'low',
    defaultSensitivity: 'skin',
    bioTrait: 'Control bolas de pelo (Hairball) + Omega 3',
  },
  {
    id: 'cat_naranja',
    name: 'Felino Naranja / Atigrado (Tabby)',
    species: 'cat',
    category: 'criollo',
    categoryLabel: 'Manto Atigrado',
    emoji: '🧡',
    avgWeightKg: 5.2,
    puppyWeightKg: 2,
    defaultActivity: 'moderate',
    defaultSensitivity: 'weight',
    bioTrait: 'Buen apetito · Proteína limpia libre de granos',
  },
  {
    id: 'cat_calico_carey',
    name: 'Calicó / Tricolor / Carey',
    species: 'cat',
    category: 'criollo',
    categoryLabel: 'Manto Tricolor',
    emoji: '🐾',
    avgWeightKg: 4.2,
    puppyWeightKg: 1.7,
    defaultActivity: 'moderate',
    defaultSensitivity: 'skin',
    bioTrait: 'Brillo de tres tonos · Rico en Salmón y Trucha',
  },
  {
    id: 'cat_tuxedo_bombay',
    name: 'Tuxedo (Blanco y Negro) / Pantera Negra',
    species: 'cat',
    category: 'criollo',
    categoryLabel: 'Manto Brillante',
    emoji: '🐈‍⬛',
    avgWeightKg: 4.6,
    puppyWeightKg: 1.8,
    defaultActivity: 'moderate',
    defaultSensitivity: 'none',
    bioTrait: 'Pelaje espejo y alta proteína carnívora',
  },

  // ==================== GATOS: PELO CORTO DE RAZA ====================
  {
    id: 'cat_siames',
    name: 'Siamés',
    species: 'cat',
    category: 'pelo_corto',
    categoryLabel: 'Pelo Corto',
    emoji: '🐱',
    avgWeightKg: 4,
    puppyWeightKg: 1.6,
    defaultActivity: 'high',
    defaultSensitivity: 'grain_free',
    bioTrait: 'Metabolismo esbelto · 85-90% proteína animal',
  },
  {
    id: 'cat_british_shorthair',
    name: 'British Shorthair (Inglés de Pelo Corto)',
    species: 'cat',
    category: 'pelo_corto',
    categoryLabel: 'Pelo Corto Denso',
    emoji: '🐻',
    avgWeightKg: 5.5,
    puppyWeightKg: 2.2,
    defaultActivity: 'low',
    defaultSensitivity: 'weight',
    bioTrait: 'Gato de interior tranquilo · Control de peso y pelo',
  },
  {
    id: 'cat_azul_ruso',
    name: 'Azul Ruso (Russian Blue)',
    species: 'cat',
    category: 'pelo_corto',
    categoryLabel: 'Pelo Corto',
    emoji: '💎',
    avgWeightKg: 4.5,
    puppyWeightKg: 1.8,
    defaultActivity: 'moderate',
    defaultSensitivity: 'skin',
    bioTrait: 'Doble manto platinado · Salmón y Arenque',
  },
  {
    id: 'cat_scottish_fold',
    name: 'Scottish Fold',
    species: 'cat',
    category: 'pelo_corto',
    categoryLabel: 'Pelo Corto',
    emoji: '🐱',
    avgWeightKg: 4.5,
    puppyWeightKg: 1.8,
    defaultActivity: 'low',
    defaultSensitivity: 'none',
    bioTrait: 'Soporte de cartílago (WholePrey™) y cuidado indoor',
  },
  {
    id: 'cat_exotico_corto',
    name: 'Exótico de Pelo Corto',
    species: 'cat',
    category: 'pelo_corto',
    categoryLabel: 'Pelo Corto',
    emoji: '😺',
    avgWeightKg: 4.8,
    puppyWeightKg: 1.8,
    defaultActivity: 'low',
    defaultSensitivity: 'skin',
    bioTrait: 'Digestión suave y control de bolas de pelo',
  },
  {
    id: 'cat_abisinio',
    name: 'Abisinio / Somalí',
    species: 'cat',
    category: 'pelo_corto',
    categoryLabel: 'Pelo Corto Activo',
    emoji: '🐆',
    avgWeightKg: 4,
    puppyWeightKg: 1.6,
    defaultActivity: 'high',
    defaultSensitivity: 'grain_free',
    bioTrait: 'Musculatura ágil · Dieta ancestral sin granos',
  },
  {
    id: 'cat_snowshoe',
    name: 'Snowshoe / Burmese / Korat',
    species: 'cat',
    category: 'pelo_corto',
    categoryLabel: 'Pelo Corto',
    emoji: '🐾',
    avgWeightKg: 4.3,
    puppyWeightKg: 1.7,
    defaultActivity: 'moderate',
    defaultSensitivity: 'none',
    bioTrait: 'Nutrición felina rica en proteínas frescas',
  },

  // ==================== GATOS: PELO LARGO & GIGANTES ====================
  {
    id: 'cat_persa',
    name: 'Persa',
    species: 'cat',
    category: 'pelo_largo',
    categoryLabel: 'Pelo Largo',
    emoji: '👑',
    avgWeightKg: 4.5,
    puppyWeightKg: 1.8,
    defaultActivity: 'low',
    defaultSensitivity: 'skin',
    bioTrait: 'Control intensivo de bolas de pelo + Omega 3 & 6',
  },
  {
    id: 'cat_himalayo',
    name: 'Himalayo',
    species: 'cat',
    category: 'pelo_largo',
    categoryLabel: 'Pelo Largo',
    emoji: '☁️',
    avgWeightKg: 4.6,
    puppyWeightKg: 1.8,
    defaultActivity: 'low',
    defaultSensitivity: 'skin',
    bioTrait: 'Fibra natural para tránsito digestivo y manto sedoso',
  },
  {
    id: 'cat_angora_turco',
    name: 'Angora Turco',
    species: 'cat',
    category: 'pelo_largo',
    categoryLabel: 'Pelo Largo',
    emoji: '🤍',
    avgWeightKg: 4.2,
    puppyWeightKg: 1.7,
    defaultActivity: 'moderate',
    defaultSensitivity: 'skin',
    bioTrait: 'Manto sedoso y control de bolas de pelo',
  },
  {
    id: 'cat_maine_coon',
    name: 'Maine Coon (Gigante Gentil)',
    species: 'cat',
    category: 'pelo_largo',
    categoryLabel: 'Raza Gigante Felina',
    emoji: '🦁',
    avgWeightKg: 7.5,
    puppyWeightKg: 3,
    defaultActivity: 'moderate',
    defaultSensitivity: 'grain_free',
    bioTrait: 'Gran estructura muscular · Ideal Orijen 90% o Acana',
  },
  {
    id: 'cat_ragdoll',
    name: 'Ragdoll',
    species: 'cat',
    category: 'pelo_largo',
    categoryLabel: 'Raza Grande Pelo Largo',
    emoji: '🧸',
    avgWeightKg: 6.2,
    puppyWeightKg: 2.5,
    defaultActivity: 'low',
    defaultSensitivity: 'skin',
    bioTrait: 'Pelo semilargo sedoso · Salud cardíaca y Hairball',
  },
  {
    id: 'cat_bosque_noruega',
    name: 'Bosque de Noruega / Siberiano',
    species: 'cat',
    category: 'pelo_largo',
    categoryLabel: 'Pelo Largo Nórdico',
    emoji: '❄️',
    avgWeightKg: 6,
    puppyWeightKg: 2.4,
    defaultActivity: 'moderate',
    defaultSensitivity: 'grain_free',
    bioTrait: 'Doble manto impermeable · Salmón, Trucha y Venado',
  },
  {
    id: 'cat_birmano',
    name: 'Sagrado de Birmania (Birmano)',
    species: 'cat',
    category: 'pelo_largo',
    categoryLabel: 'Pelo Semilargo',
    emoji: '🐾',
    avgWeightKg: 4.5,
    puppyWeightKg: 1.8,
    defaultActivity: 'low',
    defaultSensitivity: 'skin',
    bioTrait: 'Digestión delicada y cuidado urinario',
  },

  // ==================== GATOS: EXÓTICOS ====================
  {
    id: 'cat_bengali',
    name: 'Bengalí (Leopardo Asiático)',
    species: 'cat',
    category: 'exotico',
    categoryLabel: 'Exótico Atlética',
    emoji: '🐆',
    avgWeightKg: 5,
    puppyWeightKg: 2,
    defaultActivity: 'high',
    defaultSensitivity: 'grain_free',
    bioTrait: 'Instinto salvaje hiperactivo · 85-90% carne pura',
  },
  {
    id: 'cat_sphynx',
    name: 'Sphynx (Gato Egipcio Sin Pelo)',
    species: 'cat',
    category: 'exotico',
    categoryLabel: 'Exótico Termorregulador',
    emoji: '🛸',
    avgWeightKg: 4,
    puppyWeightKg: 1.7,
    defaultActivity: 'high',
    defaultSensitivity: 'grain_free',
    bioTrait: 'Metabolismo acelerado para mantener calor corporal',
  },
  {
    id: 'cat_savannah',
    name: 'Savannah / Toyger / Ocicat',
    species: 'cat',
    category: 'exotico',
    categoryLabel: 'Exótico Salvaje',
    emoji: '🐅',
    avgWeightKg: 6.5,
    puppyWeightKg: 2.5,
    defaultActivity: 'high',
    defaultSensitivity: 'grain_free',
    bioTrait: 'Carnívoro estricto de alta demanda proteica',
  },
  {
    id: 'cat_devon_rex',
    name: 'Devon Rex / Cornish Rex',
    species: 'cat',
    category: 'exotico',
    categoryLabel: 'Exótico Rizado',
    emoji: '🐱',
    avgWeightKg: 3.5,
    puppyWeightKg: 1.5,
    defaultActivity: 'high',
    defaultSensitivity: 'skin',
    bioTrait: 'Piel delicada y manto ondulado · Rico en Omega 3',
  },
];

interface BreedSelectorSheetProps {
  visible: boolean;
  species: 'dog' | 'cat';
  selectedBreedName: string;
  onClose: () => void;
  onSelectBreed: (breed: PetBreedOption) => void;
}

export const BreedSelectorSheet: React.FC<BreedSelectorSheetProps> = ({
  visible,
  species,
  selectedBreedName,
  onClose,
  onSelectBreed,
}) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<BreedSizeFilter>('all');

  const {
    translateY,
    isExpanded,
    isDragging,
    headerPanHandlers,
    grabberPanHandlers,
    animateClose,
  } = useDraggableSheet({
    visible,
    onClose,
  });

  // Reinicia filtro de categoría si cambia de especie y la categoría actual no aplica
  const filterTabs = useMemo(() => {
    if (species === 'dog') {
      return [
        { id: 'all' as BreedSizeFilter, label: 'Todas (45+)' },
        { id: 'criollo' as BreedSizeFilter, label: '🐾 Criollo' },
        { id: 'pequeno' as BreedSizeFilter, label: '🐶 Pequeñas' },
        { id: 'mediano' as BreedSizeFilter, label: '🐕 Medianas' },
        { id: 'grande' as BreedSizeFilter, label: '🐺 Grandes' },
        { id: 'gigante' as BreedSizeFilter, label: '🦁 Gigantes' },
      ];
    }
    return [
      { id: 'all' as BreedSizeFilter, label: 'Todas (25+)' },
      { id: 'criollo' as BreedSizeFilter, label: '🐾 Criollo' },
      { id: 'pelo_corto' as BreedSizeFilter, label: '🐱 Pelo Corto' },
      { id: 'pelo_largo' as BreedSizeFilter, label: '🦁 Pelo Largo' },
      { id: 'exotico' as BreedSizeFilter, label: '🐆 Exóticos' },
    ];
  }, [species]);

  const filteredBreeds = useMemo(() => {
    return PET_BREEDS_CATALOG.filter((b) => {
      if (b.species !== species) return false;
      if (activeCategory !== 'all' && b.category !== activeCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          b.name.toLowerCase().includes(q) ||
          b.categoryLabel.toLowerCase().includes(q) ||
          b.bioTrait.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [species, activeCategory, searchQuery]);

  const handleChooseBreed = (breed: PetBreedOption) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSelectBreed(breed);
    setSearchQuery('');
    animateClose();
  };

  const handleUseCustomBreed = () => {
    if (!searchQuery.trim()) return;
    const customOption: PetBreedOption = {
      id: 'custom_' + Date.now(),
      name: searchQuery.trim(),
      species,
      category: 'criollo',
      categoryLabel: 'Raza Personalizada',
      emoji: species === 'cat' ? '🐱' : '🐶',
      avgWeightKg: species === 'cat' ? 4.5 : 18,
      puppyWeightKg: species === 'cat' ? 1.8 : 7,
      defaultActivity: 'moderate',
      defaultSensitivity: 'none',
      bioTrait: 'Perfil nutricional personalizado',
    };
    handleChooseBreed(customOption);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={animateClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouch} onPress={animateClose} />

        <Animated.View
          style={[
            styles.sheetContainer,
            isExpanded && styles.sheetContainerExpanded,
            { transform: [{ translateY }] },
          ]}
        >
          {/* Cabecera arrastrable estilo Uber */}
          <View style={styles.sheetHeaderBar}>
            <View style={styles.dragIndicatorHitZone} {...grabberPanHandlers}>
              <View
                style={[
                  styles.dragIndicator,
                  isDragging && styles.dragIndicatorActive,
                ]}
              />
            </View>

            <View style={styles.sheetTitleRow} {...headerPanHandlers}>
              <View style={styles.headerTitleLeft}>
                <View style={styles.speciesBadge}>
                  <Text style={{ fontSize: 16 }}>
                    {species === 'cat' ? '🐱' : '🐶'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.mainHeaderTitle}>
                    Razas de {species === 'cat' ? 'Gatos' : 'Perros'}
                  </Text>
                  <Text style={styles.subHeaderTitle}>
                    Elige su raza para calibrar peso y nutrición biológica
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={animateClose}
                style={styles.closeBtn}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Buscador instantáneo de raza */}
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#9CA3AF" />
              <TextInput
                value={searchQuery}
                onChangeText={(txt) => {
                  setSearchQuery(txt);
                  if (txt.trim() && activeCategory !== 'all') {
                    setActiveCategory('all');
                  }
                }}
                placeholder={
                  species === 'cat'
                    ? 'Buscar raza (ej. Siamés, Persa, Criollo, Maine Coon...)'
                    : 'Buscar raza (ej. Golden, Bulldog, Criollo, Schnauzer...)'
                }
                placeholderTextColor="#6B7280"
                style={styles.searchInput}
                underlineColorAndroid="transparent"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </Pressable>
              )}
            </View>

            {/* Píldoras horizontales por tamaño / tipo */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterPillsScroll}
            >
              {filterTabs.map((tab) => {
                const active = activeCategory === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setActiveCategory(tab.id);
                    }}
                    style={[
                      styles.filterPill,
                      active && styles.filterPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        active && styles.filterPillTextActive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Lista de razas */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, 16) + 28 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {filteredBreeds.map((breed) => {
              const isSelected =
                selectedBreedName.toLowerCase() === breed.name.toLowerCase();
              return (
                <Pressable
                  key={breed.id}
                  onPress={() => handleChooseBreed(breed)}
                  style={({ pressed }) => [
                    styles.breedCard,
                    isSelected && styles.breedCardSelected,
                    pressed && { opacity: 0.86 },
                  ]}
                >
                  <View
                    style={[
                      styles.breedEmojiCircle,
                      isSelected && styles.breedEmojiCircleSelected,
                    ]}
                  >
                    <Text style={{ fontSize: 23 }}>{breed.emoji}</Text>
                  </View>

                  <View style={styles.breedTextCol}>
                    <View style={styles.breedTitleRow}>
                      <Text
                        style={[
                          styles.breedName,
                          isSelected && { color: colors.primary.light },
                        ]}
                        numberOfLines={1}
                      >
                        {breed.name}
                      </Text>
                    </View>

                    <Text style={styles.breedBioTrait} numberOfLines={1}>
                      {breed.bioTrait}
                    </Text>

                    <View style={styles.breedTagsRow}>
                      <View style={styles.breedCategoryBadge}>
                        <Text style={styles.breedCategoryText}>
                          {breed.categoryLabel}
                        </Text>
                      </View>
                      <View style={styles.breedWeightBadge}>
                        <Text style={styles.breedWeightText}>
                          Peso adulto prom: ~{breed.avgWeightKg} kg
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleSelected,
                    ]}
                  >
                    {isSelected ? (
                      <Ionicons name="checkmark" size={14} color="#050508" />
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={14}
                        color="#6B7280"
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}

            {/* Opción de usar el texto buscado si escribió una mezcla o raza muy específica */}
            {searchQuery.trim().length > 1 && (
              <Pressable
                onPress={handleUseCustomBreed}
                style={styles.customBreedFallbackBtn}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={20}
                  color={colors.primary.light}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.customBreedFallbackTitle}>
                    Usar "{searchQuery.trim()}" como raza de mi mascota
                  </Text>
                  <Text style={styles.customBreedFallbackSub}>
                    Toca aquí si tu mascota es una mezcla única o raza especial
                  </Text>
                </View>
              </Pressable>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#0A0B0E',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
  },
  sheetContainerExpanded: {
    maxHeight: '95%',
  },
  sheetHeaderBar: {
    paddingTop: 6,
    paddingBottom: 12,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
    gap: 12,
  },
  dragIndicatorHitZone: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 36,
  },
  dragIndicator: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
  },
  dragIndicatorActive: {
    backgroundColor: colors.primary.light,
    width: 52,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 10,
  },
  speciesBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(212, 175, 55, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  subHeaderTitle: {
    color: '#9CA3AF',
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#181B22',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#151821',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
    height: '100%',
  },
  filterPillsScroll: {
    gap: 8,
    paddingRight: 8,
  },
  filterPill: {
    backgroundColor: '#161922',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  filterPillActive: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.light,
  },
  filterPillText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: '#050508',
    fontWeight: '900',
  },
  scrollArea: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 10,
  },
  breedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#12151C',
    borderRadius: 18,
    padding: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  breedCardSelected: {
    backgroundColor: '#171B26',
    borderColor: colors.primary.DEFAULT,
  },
  breedEmojiCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#181C26',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  breedEmojiCircleSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.16)',
    borderColor: colors.primary.DEFAULT,
  },
  breedTextCol: {
    flex: 1,
    gap: 3,
  },
  breedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breedName: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
  breedBioTrait: {
    color: '#9CA3AF',
    fontSize: 11.5,
  },
  breedTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  breedCategoryBadge: {
    backgroundColor: '#1A1E29',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  breedCategoryText: {
    color: '#D1D5DB',
    fontSize: 10,
    fontWeight: '700',
  },
  breedWeightBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  breedWeightText: {
    color: colors.primary.light,
    fontSize: 10,
    fontWeight: '800',
  },
  radioCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#181B22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    backgroundColor: colors.primary.DEFAULT,
  },
  customBreedFallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    marginTop: 4,
  },
  customBreedFallbackTitle: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  customBreedFallbackSub: {
    color: '#9CA3AF',
    fontSize: 11.5,
    marginTop: 2,
  },
});
