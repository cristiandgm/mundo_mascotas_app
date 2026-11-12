import React, { useEffect, useState } from 'react';
import { Image, StyleProp, Text, View, ViewStyle } from 'react-native';

export interface ProductVisualSource {
  imageUrl?: string;
  petType: 'dog' | 'cat';
  subFilter?: 'humedos' | 'premios' | 'higiene' | 'medicamentos';
}

interface ProductThumbnailProps {
  product: ProductVisualSource;
  style?: StyleProp<ViewStyle>;
  emojiSize?: number;
  borderRadius?: number;
  padding?: number;
}

export function getProductFallbackEmoji(product: ProductVisualSource): string {
  if (product.subFilter === 'medicamentos') return '💊';
  if (product.subFilter === 'humedos') return '🥫';
  if (product.subFilter === 'premios') return '🦴';
  if (product.subFilter === 'higiene') return '🧼';
  return product.petType === 'cat' ? '🐱' : '🐶';
}

/**
 * Muestra la foto real del producto (desde Shopify) sobre un lienzo claro uniforme,
 * evitando que empaques oscuros o fotos JPG con fondo blanco desentonen en modo oscuro.
 * Si no hay imagen o falla la carga, muestra automáticamente el emoji de respaldo.
 */
export const ProductThumbnail: React.FC<ProductThumbnailProps> = ({
  product,
  style,
  emojiSize = 28,
  borderRadius = 14,
  padding = 6,
}) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [product.imageUrl]);

  const showImage = Boolean(product.imageUrl) && !failed;

  return (
    <View
      style={[
        {
          borderRadius,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: showImage ? '#FFFFFF' : 'rgba(255, 255, 255, 0.05)',
          padding: showImage ? padding : 0,
        },
        style,
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: product.imageUrl }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <Text style={{ fontSize: emojiSize }}>
          {getProductFallbackEmoji(product)}
        </Text>
      )}
    </View>
  );
};

