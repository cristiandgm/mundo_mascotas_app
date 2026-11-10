import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import {
  useAuth,
  COIN_VALUE_COP,
} from '../context/AuthContext';
import { useDraggableSheet } from '../utils/useDraggableSheet';

interface ConsenticoinsWalletModalProps {
  visible: boolean;
  onClose: () => void;
  applyCoinsInCart: boolean;
  onToggleApplyCoinsInCart: (apply: boolean) => void;
  onOpenCartWithCoins: () => void;
  onRedeemFreeProduct: (productId: string) => void;
  onOpenQuiz?: () => void;
}

type WalletTabType = 'statement' | 'vault' | 'earn';
type StatementFilterType = 'all' | 'earn' | 'redeem';

interface VaultRewardItem {
  id: string;
  productId: string;
  brand: string;
  name: string;
  subtitle: string;
  emoji: string;
  coinsRequired: number;
  normalPriceCop: number;
  tag: string;
}

const VAULT_REWARDS: VaultRewardItem[] = [
  {
    id: 'reward_diamond_creamy',
    productId: 'prod_cat_snack_3',
    brand: 'Diamond Naturals',
    name: 'Snacks Cremosos Salmón & Atún (x12)',
    subtitle: 'Tubitos hidratantes altos en taurina · 100% Gratis con Coins',
    emoji: '🐟',
    coinsRequired: 420,
    normalPriceCop: 46000,
    tag: 'Canje Rápido',
  },
  {
    id: 'reward_diamond_biscuits',
    productId: 'prod_dog_snack_3',
    brand: 'Diamond Naturals',
    name: 'Galletas Horneadas Cordero & Manzana (2 LB)',
    subtitle: 'Premios crujientes para salud dental canina',
    emoji: '🦴',
    coinsRequired: 580,
    normalPriceCop: 49000,
    tag: 'Más Canjeado',
  },
  {
    id: 'reward_acana_biscuits',
    productId: 'prod_dog_snack_4',
    brand: 'Acana',
    name: 'Acana Crunchy Biscuits Hígado de Res',
    subtitle: 'Bocados proteicos con camote y caldo de hueso',
    emoji: '🥩',
    coinsRequired: 690,
    normalPriceCop: 54000,
    tag: 'Biológico',
  },
  {
    id: 'reward_orijen_fd',
    productId: 'prod_dog_snack_2',
    brand: 'Orijen',
    name: 'Orijen Original Freeze-Dried Treats (92g)',
    subtitle: 'Premios 100% carne liofilizada sin cocción',
    emoji: '👑',
    coinsRequired: 840,
    normalPriceCop: 68500,
    tag: 'Ultra Luxury',
  },
];

const BANK_MISSIONS = [
  {
    id: 'mission_bio_profile',
    title: 'Sincronizar Ficha Biológica',
    subtitle: 'Verifica el peso y etapa actual de tu mascota activa',
    coins: 60,
    icon: 'fitness-outline' as const,
  },
  {
    id: 'mission_smart_reminder',
    title: 'Activar Alerta de Bulto por Agotarse',
    subtitle: 'Te avisamos 4 días antes de que se acabe su concentrado',
    coins: 90,
    icon: 'notifications-outline' as const,
  },
  {
    id: 'mission_coverage_check',
    title: 'Validar Dirección Principal VIP',
    subtitle: 'Confirma tu cobertura de entrega en Bogotá o Nacional',
    coins: 50,
    icon: 'shield-checkmark-outline' as const,
  },
];

export const ConsenticoinsWalletModal: React.FC<
  ConsenticoinsWalletModalProps
> = ({
  visible,
  onClose,
  applyCoinsInCart,
  onToggleApplyCoinsInCart,
  onOpenCartWithCoins,
  onRedeemFreeProduct,
}) => {
  const insets = useSafeAreaInsets();
  const {
    user,
    activePet,
    openAuthModal,
    coinTransactions,
    claimedMissions,
    redeemCoins,
    claimMission,
  } = useAuth();

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

  const [activeTab, setActiveTab] = useState<WalletTabType>('statement');
  const [statementFilter, setStatementFilter] =
    useState<StatementFilterType>('all');
  const [showPrimaryInCop, setShowPrimaryInCop] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const triggerFeedback = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const formatCOP = (amount: number) => {
    return (
      '$ ' +
      Math.round(amount)
        .toFixed(0)
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    );
  };

  const formatNumber = (num: number) => {
    return Math.round(num)
      .toFixed(0)
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const currentCoins = user ? user.points : 250;
  const currentCopValue = currentCoins * COIN_VALUE_COP;

  // Nivel del Club según saldo/historial
  const tierInfo = useMemo(() => {
    if (!user) {
      return {
        currentTier: 'BONO DE APERTURA',
        nextTier: 'Oro Champions',
        progress: 0.25,
        coinsToNext: 250,
        cashbackRate: '1 Coin por cada $1.000 COP',
      };
    }
    if (currentCoins >= 1200) {
      return {
        currentTier: 'BLACK ANCESTRAL',
        nextTier: 'Nivel Máximo Alcanzado',
        progress: 1,
        coinsToNext: 0,
        cashbackRate: 'Prioridad en Ruta + Sorpresa Cumpleaños',
      };
    }
    if (currentCoins >= 500) {
      const progress = Math.min(1, (currentCoins - 500) / 700);
      return {
        currentTier: 'ORO CHAMPIONS VIP',
        nextTier: 'Black Ancestral (1.200 Coins)',
        progress,
        coinsToNext: Math.max(0, 1200 - currentCoins),
        cashbackRate: '1 Coin ($20 COP) por cada $1.000 en bultos',
      };
    }
    const progress = Math.min(1, currentCoins / 500);
    return {
      currentTier: 'CLUB CONSENTIDOS',
      nextTier: 'Oro Champions VIP (500 Coins)',
      progress,
      coinsToNext: Math.max(0, 500 - currentCoins),
      cashbackRate: '1 Coin ($20 COP) por cada $1.000 en bultos',
    };
  }, [user, currentCoins]);

  // Totales de ingresos y canjes del extracto
  const statementStats = useMemo(() => {
    let totalEarned = 0;
    let totalRedeemed = 0;
    coinTransactions.forEach((tx) => {
      if (tx.type === 'earn') totalEarned += tx.coins;
      else totalRedeemed += tx.coins;
    });
    return { totalEarned, totalRedeemed };
  }, [coinTransactions]);

  const filteredTransactions = useMemo(() => {
    if (statementFilter === 'all') return coinTransactions;
    return coinTransactions.filter((tx) => tx.type === statementFilter);
  }, [coinTransactions, statementFilter]);

  const handleUseInBagPress = () => {
    if (!user) {
      Haptics.selectionAsync();
      animateClose();
      setTimeout(() => openAuthModal('login'), 220);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onToggleApplyCoinsInCart(true);
    animateClose();
    setTimeout(() => onOpenCartWithCoins(), 200);
  };

  const handleRedeemVaultItem = (reward: VaultRewardItem) => {
    if (!user) {
      Haptics.selectionAsync();
      animateClose();
      setTimeout(() => openAuthModal('login'), 220);
      return;
    }
    if (currentCoins < reward.coinsRequired) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      triggerFeedback(
        `Te faltan ${
          reward.coinsRequired - currentCoins
        } Coins para este premio. ¡Reclama una misión en la pestaña Ganar +Coins!`
      );
      return;
    }

    const ok = redeemCoins(
      reward.coinsRequired,
      `Canje Bóveda · ${reward.name}`,
      `Premio redimido con Consenticoins para ${activePet.name}`,
      `BÓVEDA-${reward.coinsRequired}`
    );

    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onRedeemFreeProduct(reward.productId);
      triggerFeedback(
        `✓ ¡Canje exitoso! Se agregaron "${reward.name}" a tu Bolsa y se descontaron ${reward.coinsRequired} Coins.`
      );
    }
  };

  const handleClaimMission = (mission: (typeof BANK_MISSIONS)[0]) => {
    if (!user) {
      Haptics.selectionAsync();
      animateClose();
      setTimeout(() => openAuthModal('login'), 220);
      return;
    }
    const ok = claimMission(
      mission.id,
      mission.coins,
      `Misión Completada · ${mission.title}`,
      `${mission.subtitle} (+${mission.coins} Coins)`
    );
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      triggerFeedback(
        `🎉 ¡+${mission.coins} Consenticoins (${formatCOP(
          mission.coins * COIN_VALUE_COP
        )}) abonados a tu Billetera!`
      );
    }
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
          {/* ==================== 1. HEADER BANCARIO ARRASTRABLE ==================== */}
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
                <View style={styles.bankIconBadge}>
                  <Text style={{ fontSize: 15 }}>🪙</Text>
                </View>
                <View>
                  <Text style={styles.uberMainHeaderTitle}>
                    Consenticoins Cash
                  </Text>
                  <Text style={styles.bankRateSubtitle}>
                    Tasa oficial: 1 Coin = {formatCOP(COIN_VALUE_COP)} COP
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
          </View>

          {/* Toast de confirmación bancaria en vivo */}
          {feedbackToast && (
            <View style={styles.liveBankToast}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={colors.primary.light}
              />
              <Text style={styles.liveBankToastText}>{feedbackToast}</Text>
            </View>
          )}

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, 16) + 32 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* ==================== 2. TARJETA METÁLICA "MUNDO MASCOTAS BLACK & GOLD CARD" ==================== */}
            <LinearGradient
              colors={['#261F10', '#141720', '#0C0E14']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.metallicBankCard}
            >
              {/* Fila superior de la tarjeta: Emblema + Nivel + Contactless */}
              <View style={styles.cardTopRow}>
                <View style={styles.cardIssuerRow}>
                  <View style={styles.cardGoldDot} />
                  <Text style={styles.cardIssuerName}>
                    MUNDO MASCOTAS · RESERVE
                  </Text>
                </View>

                <View style={styles.cardTierBadge}>
                  <Ionicons
                    name="sparkles"
                    size={10}
                    color={colors.primary.light}
                  />
                  <Text style={styles.cardTierBadgeText}>
                    {tierInfo.currentTier}
                  </Text>
                </View>
              </View>

              {/* Chip metálico EMV + Botón de alternar moneda (Coins ⇄ COP) */}
              <View style={styles.cardChipAndToggleRow}>
                <View style={styles.emvChip}>
                  <View style={styles.emvChipInnerLine} />
                  <View style={styles.emvChipVerticalLine} />
                </View>

                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setShowPrimaryInCop((prev) => !prev);
                  }}
                  style={styles.currencyToggleBtn}
                >
                  <Ionicons
                    name="swap-horizontal"
                    size={13}
                    color={colors.primary.light}
                  />
                  <Text style={styles.currencyToggleText}>
                    {showPrimaryInCop ? 'Ver en Coins' : 'Ver en Pesos (COP)'}
                  </Text>
                </Pressable>
              </View>

              {/* Saldo Principal Gigante estilo Uber Cash / Apple Card */}
              <View style={styles.cardBalanceSection}>
                <Text style={styles.cardBalanceLabel}>
                  {user
                    ? 'SALDO DISPONIBLE PARA REDIMIR'
                    : 'BONO DE BIENVENIDA LISTO PARA ACTIVAR'}
                </Text>

                <View style={styles.cardPrimaryBalanceRow}>
                  <Text style={styles.cardPrimaryBalanceValue}>
                    {showPrimaryInCop
                      ? formatCOP(currentCopValue)
                      : `${formatNumber(currentCoins)} COINS`}
                  </Text>
                  <View style={styles.cardActivePulsePill}>
                    <View style={styles.cardActivePulseDot} />
                    <Text style={styles.cardActivePulseText}>
                      {user ? 'Activo' : 'Pendiente'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardSecondaryEquivalent}>
                  {showPrimaryInCop
                    ? `Equivalente a ${formatNumber(
                        currentCoins
                      )} Consenticoins 🪙`
                    : `Equivalente a ${formatCOP(
                        currentCopValue
                      )} COP en descuento directo`}
                </Text>
              </View>

              {/* Pie de la tarjeta metálica: Titular + Número enmascarado + Mascota */}
              <View style={styles.cardBottomFooter}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardFooterCaption}>TITULAR VIP</Text>
                  <Text style={styles.cardHolderName} numberOfLines={1}>
                    {user ? user.name.toUpperCase() : 'INVITADO MUNDO MASCOTAS'}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.cardFooterCaption}>
                    CUENTA VINCULADA A
                  </Text>
                  <Text style={styles.cardMaskedNumber}>
                    {user
                      ? `${activePet.species === 'cat' ? '🐱' : '🐶'} ${activePet.name.toUpperCase()} · •••• 8324`
                      : '•••• 0250'}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {/* Si está en Modo Invitado: Banner coherente para activar su billetera */}
            {!user && (
              <View style={styles.guestActivateCard}>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.guestActivateTitle}>
                    🎁 Reclama tus primeros 250 Consenticoins ({formatCOP(5000)})
                  </Text>
                  <Text style={styles.guestActivateSub}>
                    Inicia sesión o crea tu cuenta en 15 segundos para activar
                    tu tarjeta y usar tu saldo en tu primer pedido.
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    animateClose();
                    setTimeout(() => openAuthModal('login'), 200);
                  }}
                  style={styles.guestActivateBtn}
                >
                  <Text style={styles.guestActivateBtnText}>Activar</Text>
                  <Ionicons name="arrow-forward" size={14} color="#050508" />
                </Pressable>
              </View>
            )}

            {/* ==================== 3. BOTONES DE ACCIÓN BANCARIA RÁPIDA ==================== */}
            <View style={styles.bankQuickActionsRow}>
              <Pressable
                onPress={handleUseInBagPress}
                style={({ pressed }) => [
                  styles.bankQuickActionItem,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View
                  style={[
                    styles.bankQuickActionCircle,
                    styles.bankQuickActionCircleGold,
                  ]}
                >
                  <Ionicons name="bag-check" size={20} color="#050508" />
                </View>
                <Text style={styles.bankQuickActionLabel}>Usar en Bolsa</Text>
                <Text style={styles.bankQuickActionSub}>
                  -{formatCOP(currentCopValue)}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveTab('vault');
                }}
                style={({ pressed }) => [
                  styles.bankQuickActionItem,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View
                  style={[
                    styles.bankQuickActionCircle,
                    activeTab === 'vault' && styles.bankQuickActionCircleActive,
                  ]}
                >
                  <Ionicons
                    name="gift-outline"
                    size={20}
                    color={
                      activeTab === 'vault' ? colors.primary.light : '#FFFFFF'
                    }
                  />
                </View>
                <Text style={styles.bankQuickActionLabel}>Bóveda Canje</Text>
                <Text style={styles.bankQuickActionSub}>Snacks gratis</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveTab('earn');
                }}
                style={({ pressed }) => [
                  styles.bankQuickActionItem,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View
                  style={[
                    styles.bankQuickActionCircle,
                    activeTab === 'earn' && styles.bankQuickActionCircleActive,
                  ]}
                >
                  <Ionicons
                    name="flash-outline"
                    size={20}
                    color={
                      activeTab === 'earn' ? colors.primary.light : '#FFFFFF'
                    }
                  />
                </View>
                <Text style={styles.bankQuickActionLabel}>Ganar +Coins</Text>
                <Text style={styles.bankQuickActionSub}>Misiones VIP</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveTab('statement');
                }}
                style={({ pressed }) => [
                  styles.bankQuickActionItem,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View
                  style={[
                    styles.bankQuickActionCircle,
                    activeTab === 'statement' &&
                      styles.bankQuickActionCircleActive,
                  ]}
                >
                  <Ionicons
                    name="receipt-outline"
                    size={20}
                    color={
                      activeTab === 'statement'
                        ? colors.primary.light
                        : '#FFFFFF'
                    }
                  />
                </View>
                <Text style={styles.bankQuickActionLabel}>Extracto</Text>
                <Text style={styles.bankQuickActionSub}>
                  {coinTransactions.length} movs.
                </Text>
              </Pressable>
            </View>

            {/* ==================== 4. BARRA DE PROGRESO DEL NIVEL VIP ==================== */}
            <View style={styles.tierProgressCard}>
              <View style={styles.tierProgressHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tierProgressTitle}>
                    Beneficio Activo: {tierInfo.cashbackRate}
                  </Text>
                  <Text style={styles.tierProgressSubtitle}>
                    {tierInfo.coinsToNext > 0
                      ? `Te faltan ${tierInfo.coinsToNext} Coins para subir a ${tierInfo.nextTier}`
                      : '¡Estás en el nivel más alto de Mundo Mascotas!'}
                  </Text>
                </View>
                <View style={styles.tierPercentagePill}>
                  <Text style={styles.tierPercentageText}>
                    {Math.round(tierInfo.progress * 100)}%
                  </Text>
                </View>
              </View>

              <View style={styles.tierBarTrack}>
                <View
                  style={[
                    styles.tierBarFill,
                    { width: `${Math.max(10, Math.round(tierInfo.progress * 100))}%` },
                  ]}
                />
              </View>
            </View>

            {/* ==================== 5. SELECTOR DE PESTAÑAS INTERNAS ==================== */}
            <View style={styles.walletTabsBar}>
              {[
                {
                  id: 'statement' as WalletTabType,
                  label: '🧾 Extracto',
                },
                {
                  id: 'vault' as WalletTabType,
                  label: '🎁 Bóveda de Canje',
                },
                {
                  id: 'earn' as WalletTabType,
                  label: '⚡ Ganar +Coins',
                },
              ].map((t) => {
                const active = activeTab === t.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setActiveTab(t.id);
                    }}
                    style={[
                      styles.walletTabBtn,
                      active && styles.walletTabBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.walletTabBtnText,
                        active && styles.walletTabBtnTextActive,
                      ]}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* ===================================================================================== */}
            {/* ==================== PESTAÑA 1: EXTRACTO BANCARIO DE MOVIMIENTOS ==================== */}
            {/* ===================================================================================== */}
            {activeTab === 'statement' && (
              <View style={styles.tabSectionWrap}>
                {/* Resumen contable de Ingresos vs Redenciones */}
                <View style={styles.statementSummaryRow}>
                  <View style={styles.statementSummaryBox}>
                    <Text style={styles.statementSummaryLabel}>
                      INGRESOS ACUMULADOS
                    </Text>
                    <Text style={styles.statementSummaryEarned}>
                      +{formatNumber(statementStats.totalEarned)} Coins
                    </Text>
                    <Text style={styles.statementSummaryCop}>
                      {formatCOP(statementStats.totalEarned * COIN_VALUE_COP)}
                    </Text>
                  </View>

                  <View style={styles.statementSummaryDivider} />

                  <View style={styles.statementSummaryBox}>
                    <Text style={styles.statementSummaryLabel}>
                      CANJES REALIZADOS
                    </Text>
                    <Text style={styles.statementSummaryRedeemed}>
                      -{formatNumber(statementStats.totalRedeemed)} Coins
                    </Text>
                    <Text style={styles.statementSummaryCop}>
                      {formatCOP(
                        statementStats.totalRedeemed * COIN_VALUE_COP
                      )}{' '}
                      ahorrados
                    </Text>
                  </View>
                </View>

                {/* Filtros de movimientos */}
                <View style={styles.statementFilterRow}>
                  {[
                    { id: 'all' as StatementFilterType, label: 'Todos' },
                    {
                      id: 'earn' as StatementFilterType,
                      label: 'Abonos (+)',
                    },
                    {
                      id: 'redeem' as StatementFilterType,
                      label: 'Canjes (-)',
                    },
                  ].map((f) => {
                    const active = statementFilter === f.id;
                    return (
                      <Pressable
                        key={f.id}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setStatementFilter(f.id);
                        }}
                        style={[
                          styles.statementFilterPill,
                          active && styles.statementFilterPillActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statementFilterText,
                            active && styles.statementFilterTextActive,
                          ]}
                        >
                          {f.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Lista de transacciones bancarias */}
                <View style={styles.transactionsCard}>
                  {filteredTransactions.map((tx, idx) => {
                    const isEarn = tx.type === 'earn';
                    return (
                      <View
                        key={tx.id}
                        style={[
                          styles.txRow,
                          idx > 0 && styles.txRowBorder,
                        ]}
                      >
                        <View
                          style={[
                            styles.txIconBox,
                            isEarn
                              ? styles.txIconBoxEarn
                              : styles.txIconBoxRedeem,
                          ]}
                        >
                          <Ionicons
                            name={
                              tx.category === 'bonus'
                                ? 'sparkles-outline'
                                : tx.category === 'mission'
                                ? 'flash-outline'
                                : isEarn
                                ? 'arrow-down-outline'
                                : 'bag-check-outline'
                            }
                            size={18}
                            color={
                              isEarn ? colors.primary.light : '#9CA3AF'
                            }
                          />
                        </View>

                        <View style={styles.txInfoCol}>
                          <Text style={styles.txTitle} numberOfLines={1}>
                            {tx.title}
                          </Text>
                          <Text style={styles.txSubtitle} numberOfLines={1}>
                            {tx.subtitle}
                          </Text>
                          <View style={styles.txMetaRow}>
                            <Text style={styles.txDateText}>{tx.date}</Text>
                            {tx.reference && (
                              <View style={styles.txRefPill}>
                                <Text style={styles.txRefText}>
                                  {tx.reference}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>

                        <View style={styles.txAmountCol}>
                          <Text
                            style={[
                              styles.txCoinsAmount,
                              isEarn
                                ? styles.txCoinsEarn
                                : styles.txCoinsRedeem,
                            ]}
                          >
                            {isEarn ? '+' : '-'}
                            {tx.coins} 🪙
                          </Text>
                          <Text style={styles.txCopAmount}>
                            {isEarn ? '+' : '-'}
                            {formatCOP(tx.copEquivalent)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ===================================================================================== */}
            {/* ==================== PESTAÑA 2: BÓVEDA DE CANJE (BONOS & SNACKS) ==================== */}
            {/* ===================================================================================== */}
            {activeTab === 'vault' && (
              <View style={styles.tabSectionWrap}>
                {/* Tarjeta 1: Uso de Saldo como Efectivo en la Bolsa */}
                <View style={styles.cashDiscountToggleCard}>
                  <View style={styles.cashDiscountTopRow}>
                    <View style={styles.cashDiscountIconWrap}>
                      <Ionicons
                        name="wallet-outline"
                        size={22}
                        color={colors.primary.light}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cashDiscountTitle}>
                        Descuento directo en tu próximo Bulto
                      </Text>
                      <Text style={styles.cashDiscountSub}>
                        Usa tus {formatNumber(currentCoins)} Coins como{' '}
                        {formatCOP(currentCopValue)} de descuento inmediato en
                        tu Bolsa.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cashDiscountActionRow}>
                    <Pressable
                      onPress={() => {
                        if (!user) {
                          handleUseInBagPress();
                          return;
                        }
                        Haptics.selectionAsync();
                        const nextState = !applyCoinsInCart;
                        onToggleApplyCoinsInCart(nextState);
                        triggerFeedback(
                          nextState
                            ? `✓ Descuento de ${formatCOP(
                                currentCopValue
                              )} activado para tu Bolsa.`
                            : 'Descuento con Consenticoins desactivado para este pedido.'
                        );
                      }}
                      style={[
                        styles.cashDiscountSwitchBtn,
                        applyCoinsInCart && styles.cashDiscountSwitchBtnActive,
                      ]}
                    >
                      <Ionicons
                        name={
                          applyCoinsInCart
                            ? 'checkmark-circle'
                            : 'ellipse-outline'
                        }
                        size={17}
                        color={applyCoinsInCart ? '#050508' : '#FFFFFF'}
                      />
                      <Text
                        style={[
                          styles.cashDiscountSwitchText,
                          applyCoinsInCart &&
                            styles.cashDiscountSwitchTextActive,
                        ]}
                      >
                        {applyCoinsInCart
                          ? `Aplicando -${formatCOP(currentCopValue)} en Bolsa`
                          : `Aplicar -${formatCOP(currentCopValue)} en Bolsa`}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={handleUseInBagPress}
                      style={styles.goToBagMiniBtn}
                    >
                      <Text style={styles.goToBagMiniText}>Ir a Bolsa ›</Text>
                    </Pressable>
                  </View>
                </View>

                <Text style={styles.vaultSectionHeading}>
                  Premios 100% Gratis pagando solo con Coins
                </Text>

                {VAULT_REWARDS.map((reward) => {
                  const canAfford = currentCoins >= reward.coinsRequired;
                  const missingCoins = Math.max(
                    0,
                    reward.coinsRequired - currentCoins
                  );

                  return (
                    <View key={reward.id} style={styles.vaultRewardCard}>
                      <View style={styles.vaultRewardEmojiBox}>
                        <Text style={{ fontSize: 28 }}>{reward.emoji}</Text>
                        <View style={styles.vaultRewardTagPill}>
                          <Text style={styles.vaultRewardTagText}>
                            {reward.tag}
                          </Text>
                        </View>
                      </View>

                      <View style={{ flex: 1, gap: 3 }}>
                        <Text style={styles.vaultRewardBrand}>
                          {reward.brand}
                        </Text>
                        <Text style={styles.vaultRewardName}>
                          {reward.name}
                        </Text>
                        <Text style={styles.vaultRewardSub}>
                          {reward.subtitle}
                        </Text>

                        <View style={styles.vaultRewardBottomRow}>
                          <View>
                            <Text style={styles.vaultRewardCoinsCost}>
                              {reward.coinsRequired} Coins 🪙
                            </Text>
                            <Text style={styles.vaultRewardNormalPrice}>
                              Valor comercial: {formatCOP(reward.normalPriceCop)}
                            </Text>
                          </View>

                          <Pressable
                            onPress={() => handleRedeemVaultItem(reward)}
                            style={[
                              styles.vaultRedeemBtn,
                              !canAfford && styles.vaultRedeemBtnLocked,
                            ]}
                          >
                            <Text
                              style={[
                                styles.vaultRedeemBtnText,
                                !canAfford && styles.vaultRedeemBtnTextLocked,
                              ]}
                            >
                              {!user
                                ? 'Ingresar'
                                : canAfford
                                ? 'Canjear Gratis'
                                : `Faltan ${missingCoins}`}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* ===================================================================================== */}
            {/* ==================== PESTAÑA 3: GANAR +COINS (MISIONES & CASHBACK) ================== */}
            {/* ===================================================================================== */}
            {activeTab === 'earn' && (
              <View style={styles.tabSectionWrap}>
                <Text style={styles.vaultSectionHeading}>
                  Misiones Instantáneas · Abono en 1 Toque
                </Text>

                {BANK_MISSIONS.map((mission) => {
                  const isClaimed = claimedMissions.includes(mission.id);
                  return (
                    <View key={mission.id} style={styles.missionCard}>
                      <View
                        style={[
                          styles.missionIconBox,
                          isClaimed && styles.missionIconBoxClaimed,
                        ]}
                      >
                        <Ionicons
                          name={
                            isClaimed ? 'checkmark-circle' : mission.icon
                          }
                          size={20}
                          color={
                            isClaimed ? '#10B981' : colors.primary.light
                          }
                        />
                      </View>

                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={styles.missionTitle}>{mission.title}</Text>
                        <Text style={styles.missionSub}>
                          {mission.subtitle}
                        </Text>
                      </View>

                      <Pressable
                        disabled={isClaimed}
                        onPress={() => handleClaimMission(mission)}
                        style={[
                          styles.missionClaimBtn,
                          isClaimed && styles.missionClaimBtnDone,
                        ]}
                      >
                        <Text
                          style={[
                            styles.missionClaimBtnText,
                            isClaimed && styles.missionClaimBtnTextDone,
                          ]}
                        >
                          {isClaimed ? 'Abonado ✓' : `+${mission.coins} 🪙`}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}

                {/* Tabla de Cashback por Marca */}
                <Text style={[styles.vaultSectionHeading, { marginTop: 10 }]}>
                  Retorno Bancario por Marca de Alimento
                </Text>

                <View style={styles.cashbackTableCard}>
                  {[
                    {
                      brand: '💎 Diamond Naturals',
                      bag: 'Bultos 18 LB a 40 LB',
                      earn: '+189 a +290 Coins por bulto',
                      cop: 'Hasta $ 5.800 COP de retorno',
                    },
                    {
                      brand: '🐺 Taste of the Wild',
                      bag: 'Bultos Grain-Free 14 LB y 28 LB',
                      earn: '+218 a +355 Coins por bulto',
                      cop: 'Hasta $ 7.100 COP de retorno',
                    },
                    {
                      brand: '🍁 Acana Canada',
                      bag: 'Recetas WholePrey™ 10 LB y 25 LB',
                      earn: '+245 a +389 Coins por bulto',
                      cop: 'Hasta $ 7.780 COP de retorno',
                    },
                    {
                      brand: '👑 Orijen Biológico',
                      bag: '85-90% Carne Fresca 12 LB y 25 LB',
                      earn: '+315 a +435 Coins por bulto',
                      cop: 'Hasta $ 8.700 COP de retorno',
                    },
                  ].map((row, index) => (
                    <View
                      key={row.brand}
                      style={[
                        styles.cashbackTableRow,
                        index > 0 && styles.txRowBorder,
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cashbackBrandName}>
                          {row.brand}
                        </Text>
                        <Text style={styles.cashbackBagMeta}>{row.bag}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.cashbackEarnCoins}>{row.earn}</Text>
                        <Text style={styles.cashbackEarnCop}>{row.cop}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
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
    maxHeight: '92%',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
  },
  sheetContainerExpanded: {
    maxHeight: '96%',
  },
  sheetHeaderBar: {
    paddingTop: 6,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  dragIndicatorHitZone: {
    alignSelf: 'center',
    paddingVertical: 8,
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
    marginTop: 2,
  },
  headerTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bankIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212, 175, 55, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uberMainHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  bankRateSubtitle: {
    color: colors.primary.light,
    fontSize: 11.5,
    fontWeight: '700',
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
  liveBankToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.16)',
    borderWidth: 1,
    borderColor: colors.primary.DEFAULT,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  liveBankToastText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    lineHeight: 17,
  },
  scrollArea: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
  },
  /* ==================== TARJETA METÁLICA ==================== */
  metallicBankCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(212, 175, 55, 0.42)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.65,
    shadowRadius: 20,
    elevation: 14,
    gap: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardIssuerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  cardGoldDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary.DEFAULT,
  },
  cardIssuerName: {
    color: '#E5E7EB',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  cardTierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  cardTierBadgeText: {
    color: colors.primary.light,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardChipAndToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emvChip: {
    width: 40,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#D4AF37',
    borderWidth: 1,
    borderColor: '#F5E08E',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  emvChipInnerLine: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  emvChipVerticalLine: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  currencyToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  currencyToggleText: {
    color: '#E5E7EB',
    fontSize: 11,
    fontWeight: '700',
  },
  cardBalanceSection: {
    gap: 3,
    marginVertical: 2,
  },
  cardBalanceLabel: {
    color: '#9CA3AF',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardPrimaryBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardPrimaryBalanceValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  cardActivePulsePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  cardActivePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  cardActivePulseText: {
    color: '#6EE7B7',
    fontSize: 10.5,
    fontWeight: '800',
  },
  cardSecondaryEquivalent: {
    color: colors.primary.light,
    fontSize: 13,
    fontWeight: '700',
  },
  cardBottomFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardFooterCaption: {
    color: '#9CA3AF',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginBottom: 2,
  },
  cardHolderName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardMaskedNumber: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '700',
  },
  guestActivateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#141720',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  guestActivateTitle: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  guestActivateSub: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 16,
  },
  guestActivateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 14,
  },
  guestActivateBtnText: {
    color: '#050508',
    fontSize: 12.5,
    fontWeight: '900',
  },
  /* ==================== BOTONES RÁPIDOS ==================== */
  bankQuickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  bankQuickActionItem: {
    flex: 1,
    backgroundColor: '#12151C',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    gap: 4,
  },
  bankQuickActionCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1A1E29',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  bankQuickActionCircleGold: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.light,
  },
  bankQuickActionCircleActive: {
    borderColor: colors.primary.DEFAULT,
    backgroundColor: 'rgba(212, 175, 55, 0.14)',
  },
  bankQuickActionLabel: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  bankQuickActionSub: {
    color: '#9CA3AF',
    fontSize: 10.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  /* ==================== PROGRESO DEL NIVEL ==================== */
  tierProgressCard: {
    backgroundColor: '#12151C',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    gap: 10,
  },
  tierProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  tierProgressTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  tierProgressSubtitle: {
    color: '#9CA3AF',
    fontSize: 11.5,
    marginTop: 2,
  },
  tierPercentagePill: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  tierPercentageText: {
    color: colors.primary.light,
    fontSize: 11.5,
    fontWeight: '900',
  },
  tierBarTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#1E2330',
    overflow: 'hidden',
  },
  tierBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.primary.DEFAULT,
  },
  /* ==================== TABS INTERNAS ==================== */
  walletTabsBar: {
    flexDirection: 'row',
    backgroundColor: '#12151C',
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  walletTabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
  },
  walletTabBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  walletTabBtnText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },
  walletTabBtnTextActive: {
    color: '#050508',
    fontWeight: '900',
  },
  tabSectionWrap: {
    gap: 12,
  },
  /* ==================== PESTAÑA 1: EXTRACTO ==================== */
  statementSummaryRow: {
    flexDirection: 'row',
    backgroundColor: '#12151C',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  statementSummaryBox: {
    flex: 1,
    gap: 2,
  },
  statementSummaryDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 14,
  },
  statementSummaryLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  statementSummaryEarned: {
    color: colors.primary.light,
    fontSize: 16,
    fontWeight: '900',
  },
  statementSummaryRedeemed: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  statementSummaryCop: {
    color: '#9CA3AF',
    fontSize: 11.5,
    fontWeight: '600',
  },
  statementFilterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statementFilterPill: {
    backgroundColor: '#161922',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  statementFilterPillActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.16)',
    borderColor: colors.primary.DEFAULT,
  },
  statementFilterText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },
  statementFilterTextActive: {
    color: colors.primary.light,
    fontWeight: '800',
  },
  transactionsCard: {
    backgroundColor: '#12151C',
    borderRadius: 20,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  txRowBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  txIconBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  txIconBoxEarn: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  txIconBoxRedeem: {
    backgroundColor: '#191D26',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  txInfoCol: {
    flex: 1,
    gap: 2,
  },
  txTitle: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  txSubtitle: {
    color: '#9CA3AF',
    fontSize: 11.5,
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  txDateText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
  },
  txRefPill: {
    backgroundColor: '#1A1E28',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  txRefText: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '700',
  },
  txAmountCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  txCoinsAmount: {
    fontSize: 14,
    fontWeight: '900',
  },
  txCoinsEarn: {
    color: colors.primary.light,
  },
  txCoinsRedeem: {
    color: '#E5E7EB',
  },
  txCopAmount: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
  },
  /* ==================== PESTAÑA 2: BÓVEDA DE CANJE ==================== */
  cashDiscountToggleCard: {
    backgroundColor: '#151924',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.38)',
    gap: 12,
  },
  cashDiscountTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cashDiscountIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(212, 175, 55, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  cashDiscountTitle: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
  cashDiscountSub: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  cashDiscountActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cashDiscountSwitchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E2330',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  cashDiscountSwitchBtnActive: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.light,
  },
  cashDiscountSwitchText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  cashDiscountSwitchTextActive: {
    color: '#050508',
    fontWeight: '900',
  },
  goToBagMiniBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#181B22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  goToBagMiniText: {
    color: colors.primary.light,
    fontSize: 12,
    fontWeight: '800',
  },
  vaultSectionHeading: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  vaultRewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#12151C',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  vaultRewardEmojiBox: {
    width: 72,
    height: 82,
    borderRadius: 16,
    backgroundColor: '#181C26',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  vaultRewardTagPill: {
    backgroundColor: 'rgba(212, 175, 55, 0.16)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  vaultRewardTagText: {
    color: colors.primary.light,
    fontSize: 9,
    fontWeight: '800',
  },
  vaultRewardBrand: {
    color: colors.primary.light,
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vaultRewardName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  vaultRewardSub: {
    color: '#9CA3AF',
    fontSize: 11.5,
    lineHeight: 16,
  },
  vaultRewardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  vaultRewardCoinsCost: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '900',
  },
  vaultRewardNormalPrice: {
    color: '#6B7280',
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  vaultRedeemBtn: {
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 14,
  },
  vaultRedeemBtnLocked: {
    backgroundColor: '#1C202B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  vaultRedeemBtnText: {
    color: '#050508',
    fontSize: 12,
    fontWeight: '900',
  },
  vaultRedeemBtnTextLocked: {
    color: '#9CA3AF',
    fontWeight: '700',
  },
  /* ==================== PESTAÑA 3: MISIONES & CASHBACK ==================== */
  missionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#12151C',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  missionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionIconBoxClaimed: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  missionTitle: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  missionSub: {
    color: '#9CA3AF',
    fontSize: 11.5,
    lineHeight: 16,
  },
  missionClaimBtn: {
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  missionClaimBtnDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  missionClaimBtnText: {
    color: '#050508',
    fontSize: 12,
    fontWeight: '900',
  },
  missionClaimBtnTextDone: {
    color: '#6EE7B7',
    fontWeight: '800',
  },
  cashbackTableCard: {
    backgroundColor: '#12151C',
    borderRadius: 20,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  cashbackTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    gap: 10,
  },
  cashbackBrandName: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  cashbackBagMeta: {
    color: '#9CA3AF',
    fontSize: 11.5,
    marginTop: 2,
  },
  cashbackEarnCoins: {
    color: colors.primary.light,
    fontSize: 12.5,
    fontWeight: '900',
  },
  cashbackEarnCop: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
  },
});

