import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutAnimation,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { ProductBag } from '../../data/catalog';

interface BenefitItem {
  title?: string;
  body: string;
}

interface FeedingRow {
  weight: string;
  cost?: string;
  active?: string;
  lessActive?: string;
}

interface DetailsSection {
  title: string;
  paragraphs: string[];
  feedingRows: FeedingRow[];
  footnote?: string;
}

interface ParsedDescription {
  introParagraphs: string[];
  quickTags: string[];
  benefitsTitle?: string;
  benefits: BenefitItem[];
  extraParagraphs: string[];
  detailsSections: DetailsSection[];
  previewText: string;
}

const NAMED_ENTITIES: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  ndash: '–',
  mdash: '—',
  middot: '·',
  bull: '•',
};

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&([a-zA-Z]+);/g, (full, name) => NAMED_ENTITIES[name] ?? full);
}

function htmlToPlainLines(html: string): string[] {
  const cleaned = decodeHtmlEntities(html)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');

  return cleaned
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function parseFeedingRowsFromHtml(bodyHtml: string): FeedingRow[] {
  const rows: FeedingRow[] = [];
  const rowMatches = bodyHtml.match(
    /<!--\s*Fila:[\s\S]*?(?=<!--\s*Fila:|<\/div>\s*<p\b|<\/details>|$)/gi
  );

  const chunks = rowMatches && rowMatches.length > 0 ? rowMatches : [bodyHtml];

  for (const chunk of chunks) {
    if (!chunk.includes('Activo') && !chunk.includes('Menos act')) continue;
    const textLines = htmlToPlainLines(chunk);
    const weightMatch = chunk.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i);
    const spanCostMatch = chunk.match(/<span[^>]*>(\s*\$[\s\S]*?)<\/span>/i);

    const strongValues = Array.from(
      chunk.matchAll(/<strong[^>]*>([\s\S]*?)<\/strong>/gi)
    ).map((m) => decodeHtmlEntities(m[1].replace(/<[^>]+>/g, '')).trim());

    const weight = weightMatch
      ? decodeHtmlEntities(weightMatch[1].replace(/<[^>]+>/g, '')).trim()
      : textLines.find((l) => /\dkg/i.test(l)) ?? '';
    if (!weight) continue;

    const cost = spanCostMatch
      ? decodeHtmlEntities(spanCostMatch[1].replace(/<[^>]+>/g, '')).trim()
      : undefined;

    const rationValues = strongValues.filter((v) => v !== weight);
    const active = rationValues[0];
    const lessActive = rationValues[1];

    rows.push({ weight, cost, active, lessActive });
  }

  return rows;
}

function parseDetailsSections(html: string): {
  strippedHtml: string;
  sections: DetailsSection[];
} {
  const sections: DetailsSection[] = [];
  const strippedHtml = html.replace(
    /<details\b[^>]*>([\s\S]*?)<\/details>/gi,
    (_: string, inner: string) => {
      const summaryMatch = inner.match(/<summary\b[^>]*>([\s\S]*?)<\/summary>/i);
      const title = summaryMatch
        ? htmlToPlainLines(summaryMatch[1]).join(' ')
        : 'Más información';
      const bodyHtml = summaryMatch
        ? inner.replace(summaryMatch[0], '')
        : inner;

      const feedingRows = parseFeedingRowsFromHtml(bodyHtml);
      if (feedingRows.length > 0) {
        const footerMatches = Array.from(
          bodyHtml.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)
        );
        const footnote =
          footerMatches.length > 0
            ? htmlToPlainLines(footerMatches[footerMatches.length - 1][1]).join(
                ' '
              )
            : undefined;
        sections.push({
          title,
          paragraphs: [],
          feedingRows,
          footnote,
        });
      } else {
        sections.push({
          title,
          paragraphs: htmlToPlainLines(bodyHtml),
          feedingRows: [],
        });
      }
      return '';
    }
  );

  return { strippedHtml, sections };
}

function splitNumberedBenefit(line: string): BenefitItem | null {
  const numbered = line.match(/^(\d+\.\s+[^:.\n]{2,60}):\s*(.+)$/);
  if (numbered) {
    return { title: numbered[1].trim(), body: numbered[2].trim() };
  }
  const justNumbered = line.match(/^(\d+\.\s+.+)$/);
  if (justNumbered) {
    return { body: justNumbered[1].trim() };
  }
  return null;
}

function parseProductDescription(product: ProductBag): ParsedDescription {
  const rawHtml = product.descriptionHtml?.trim();
  const rawText = product.description?.trim();

  if (!rawHtml && !rawText) {
    const presentation = product.unitLabel || `${product.weightLb} LB`;
    const fallbackIntro = `Fórmula nutricional ${product.brand} (${product.stage}) elaborada con ${product.protein.toLowerCase()}, en presentación de ${presentation}.`;
    return {
      introParagraphs: [fallbackIntro],
      quickTags: [],
      benefits: [],
      extraParagraphs: [],
      detailsSections: [],
      previewText: product.protein || fallbackIntro,
    };
  }

  let workingHtml = rawHtml ?? '';
  let detailsSections: DetailsSection[] = [];
  const quickTags: string[] = [];

  if (workingHtml) {
    const parsedDetails = parseDetailsSections(workingHtml);
    workingHtml = parsedDetails.strippedHtml;
    detailsSections = parsedDetails.sections;

    // Extraer píldoras rápidas de Shopify (bloques "Etiquetas rápidas" o spans estilo chip antes de Beneficios)
    const tagBlockMatch = workingHtml.match(
      /<!--\s*Etiquetas[\s\S]*?-->([\s\S]*?)(?=<!--|<h[1-6]|<p|$)/i
    );
    if (tagBlockMatch) {
      const spans = Array.from(
        tagBlockMatch[1].matchAll(/<span\b[^>]*>([\s\S]*?)<\/span>/gi)
      );
      spans.forEach((m) => {
        const label = htmlToPlainLines(m[1]).join(' ');
        if (label && label.length <= 48) {
          quickTags.push(label);
        }
      });
      workingHtml = workingHtml.replace(tagBlockMatch[0], '\n');
    }
  }

  const lines = workingHtml
    ? htmlToPlainLines(workingHtml)
    : rawText!
        .split(/\n+/)
        .map((l) => l.trim())
        .filter(Boolean);

  const introParagraphs: string[] = [];
  const benefits: BenefitItem[] = [];
  const extraParagraphs: string[] = [];
  let benefitsTitle: string | undefined;
  let inBenefitsSection = false;

  // Si existen bloques HTML de tarjeta con <strong>1. Titulo</strong><span>Cuerpo</span>, preservar pares limpios
  const htmlBenefitCards = workingHtml
    ? Array.from(
        workingHtml.matchAll(
          /<div[^>]*border-left[^>]*>[\s\S]*?<strong[^>]*>([\s\S]*?)<\/strong>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>[\s\S]*?<\/div>/gi
        )
      )
    : [];

  if (htmlBenefitCards.length > 0) {
    let beforeBenefitsHtml = workingHtml;
    const h3Match = workingHtml.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
    if (h3Match) {
      benefitsTitle = htmlToPlainLines(h3Match[1]).join(' ');
      beforeBenefitsHtml = workingHtml.slice(0, h3Match.index);
    } else {
      const firstCardIdx = workingHtml.indexOf(htmlBenefitCards[0][0]);
      if (firstCardIdx > 0) {
        beforeBenefitsHtml = workingHtml.slice(0, firstCardIdx);
      }
    }

    introParagraphs.push(...htmlToPlainLines(beforeBenefitsHtml));
    htmlBenefitCards.forEach((m) => {
      const title = htmlToPlainLines(m[1]).join(' ');
      const body = htmlToPlainLines(m[2]).join(' ');
      if (body || title) {
        benefits.push({ title: title || undefined, body });
      }
    });
  } else {
    for (const line of lines) {
      if (/^beneficios\s+clave:?$/i.test(line)) {
        inBenefitsSection = true;
        benefitsTitle = 'Beneficios Clave';
        continue;
      }

      const numbered = splitNumberedBenefit(line);
      if (numbered && (inBenefitsSection || numbered.title || /^\d+\.\s/.test(line))) {
        inBenefitsSection = true;
        if (!benefitsTitle) benefitsTitle = 'Beneficios Clave';
        benefits.push(numbered);
        continue;
      }

      if (!inBenefitsSection && benefits.length === 0) {
        introParagraphs.push(line);
      } else {
        extraParagraphs.push(line);
      }
    }
  }

  const previewText =
    quickTags.length > 0
      ? quickTags.slice(0, 2).join(' · ')
      : introParagraphs[0] || benefits[0]?.title || product.protein;

  return {
    introParagraphs,
    quickTags,
    benefitsTitle,
    benefits,
    extraParagraphs,
    detailsSections,
    previewText,
  };
}

interface CollapsibleSectionCardProps {
  title: string;
  preview?: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}

/**
 * Tarjeta colapsable reutilizable para cada sección de la ficha del producto
 * (Descripción del producto, Detalles de conservación, Guía de alimentación, etc.).
 */
const CollapsibleSectionCard: React.FC<CollapsibleSectionCardProps> = ({
  title,
  preview,
  icon,
  children,
}) => {
  const [expanded, setExpanded] = useState(false);
  const chevronAnim = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const next = !expanded;
    setExpanded(next);

    Animated.parallel([
      Animated.timing(chevronAnim, {
        toValue: next ? 1 : 0,
        duration: 210,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(contentFade, {
        toValue: next ? 1 : 0,
        duration: next ? 220 : 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const chevronRotate = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={[styles.container, expanded && styles.containerExpanded]}>
      <Pressable
        onPress={toggle}
        style={({ pressed }) => [
          styles.headerBtn,
          pressed && { opacity: 0.86 },
        ]}
      >
        <View style={styles.headerIconBox}>
          <Ionicons name={icon} size={16} color={colors.primary.light} />
        </View>

        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          {!expanded && Boolean(preview) && (
            <Text style={styles.headerPreview} numberOfLines={1}>
              {preview}
            </Text>
          )}
        </View>

        <Animated.View
          style={[
            styles.chevronCircle,
            expanded && styles.chevronCircleActive,
            { transform: [{ rotate: chevronRotate }] },
          ]}
        >
          <Ionicons
            name="chevron-down"
            size={16}
            color={expanded ? '#050508' : '#D1D5DB'}
          />
        </Animated.View>
      </Pressable>

      {expanded && (
        <Animated.View style={[styles.body, { opacity: contentFade }]}>
          {children}
        </Animated.View>
      )}
    </View>
  );
};

function getSectionMeta(sec: DetailsSection): {
  title: string;
  preview?: string;
  icon: keyof typeof Ionicons.glyphMap;
} {
  const cleanTitle = sec.title.replace(/^[^\p{L}\p{N}]+/u, '').trim() || sec.title;
  const lower = cleanTitle.toLowerCase();

  if (
    sec.feedingRows.length > 0 ||
    lower.includes('alimentación') ||
    lower.includes('ración') ||
    lower.includes('guía')
  ) {
    return {
      title: cleanTitle,
      preview:
        sec.feedingRows.length > 0
          ? `${sec.feedingRows.length} rangos de peso · Activo / Menos act.`
          : sec.paragraphs[0],
      icon: 'restaurant-outline',
    };
  }

  if (lower.includes('presentación') || lower.includes('conservación')) {
    return {
      title: cleanTitle,
      preview: sec.paragraphs[0],
      icon: 'cube-outline',
    };
  }

  return {
    title: cleanTitle,
    preview: sec.paragraphs[0],
    icon: 'information-circle-outline',
  };
}

interface ProductDescriptionAccordionProps {
  product: ProductBag;
}

/**
 * Renderiza "Descripción del producto" junto a sus secciones independientes
 * (Detalles de presentación y conservación, Guía de alimentación, etc.) como
 * menús desplegables hermanos al mismo nivel dentro de la tarjeta del producto.
 */
export const ProductDescriptionAccordion: React.FC<
  ProductDescriptionAccordionProps
> = ({ product }) => {
  const parsed = useMemo(() => parseProductDescription(product), [product]);

  return (
    <View style={styles.accordionsStack}>
      <CollapsibleSectionCard
        title="Descripción del producto"
        preview={parsed.previewText}
        icon="document-text-outline"
      >
        {parsed.introParagraphs.map((para, idx) => (
          <Text key={`intro-${idx}`} style={styles.introText}>
            {para}
          </Text>
        ))}

        {parsed.quickTags.length > 0 && (
          <View style={styles.quickTagsWrap}>
            {parsed.quickTags.map((tag, idx) => (
              <View key={`tag-${idx}`} style={styles.quickTagChip}>
                <Text style={styles.quickTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {parsed.benefits.length > 0 && (
          <View style={styles.benefitsBlock}>
            {parsed.benefitsTitle && (
              <Text style={styles.sectionOverline}>{parsed.benefitsTitle}</Text>
            )}
            {parsed.benefits.map((b, idx) => (
              <View key={`benefit-${idx}`} style={styles.benefitCard}>
                {b.title && <Text style={styles.benefitTitle}>{b.title}</Text>}
                <Text style={styles.benefitBody}>{b.body}</Text>
              </View>
            ))}
          </View>
        )}

        {parsed.extraParagraphs.map((para, idx) => (
          <Text key={`extra-${idx}`} style={styles.extraText}>
            {para}
          </Text>
        ))}
      </CollapsibleSectionCard>

      {parsed.detailsSections.map((sec, idx) => {
        const meta = getSectionMeta(sec);
        return (
          <CollapsibleSectionCard
            key={`section-${idx}`}
            title={meta.title}
            preview={meta.preview}
            icon={meta.icon}
          >
            {sec.paragraphs.map((p, pIdx) => (
              <Text key={`sp-${pIdx}`} style={styles.subParagraphText}>
                {p}
              </Text>
            ))}

            {sec.feedingRows.length > 0 && (
              <View style={styles.feedingList}>
                {sec.feedingRows.map((row, rIdx) => (
                  <View key={`feed-${rIdx}`} style={styles.feedingRow}>
                    <View style={styles.feedingRowTop}>
                      <Text style={styles.feedingWeight}>{row.weight}</Text>
                      {row.cost && (
                        <View style={styles.feedingCostPill}>
                          <Text style={styles.feedingCostText}>{row.cost}</Text>
                        </View>
                      )}
                    </View>
                    {(row.active || row.lessActive) && (
                      <View style={styles.feedingRationPair}>
                        {row.active && (
                          <View style={styles.feedingRationBox}>
                            <Text style={styles.feedingRationLabel}>
                              🏃 Activo
                            </Text>
                            <Text style={styles.feedingRationValue}>
                              {row.active}
                            </Text>
                          </View>
                        )}
                        {row.lessActive && (
                          <View style={styles.feedingRationBox}>
                            <Text style={styles.feedingRationLabel}>
                              🛋️ Menos act.
                            </Text>
                            <Text style={styles.feedingRationValue}>
                              {row.lessActive}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {sec.footnote && (
              <Text style={styles.subFootnoteText}>{sec.footnote}</Text>
            )}
          </CollapsibleSectionCard>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  accordionsStack: {
    marginHorizontal: 22,
    marginBottom: 14,
    gap: 10,
  },
  container: {
    backgroundColor: '#171A23',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    overflow: 'hidden',
  },
  containerExpanded: {
    borderColor: 'rgba(212, 175, 55, 0.38)',
    backgroundColor: '#151822',
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  headerIconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: 'rgba(212, 175, 55, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
    gap: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  headerPreview: {
    color: '#9CA3AF',
    fontSize: 11.5,
    fontWeight: '500',
  },
  chevronCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronCircleActive: {
    backgroundColor: colors.primary.DEFAULT,
  },
  body: {
    paddingHorizontal: 13,
    paddingBottom: 14,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
  },
  introText: {
    color: '#E5E7EB',
    fontSize: 12.5,
    lineHeight: 19,
  },
  quickTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickTagChip: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.28)',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  quickTagText: {
    color: colors.primary.light,
    fontSize: 11,
    fontWeight: '700',
  },
  benefitsBlock: {
    gap: 7,
  },
  sectionOverline: {
    color: colors.primary.light,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  benefitCard: {
    backgroundColor: '#11141B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.DEFAULT,
    paddingHorizontal: 11,
    paddingVertical: 9,
    gap: 3,
  },
  benefitTitle: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  benefitBody: {
    color: '#D1D5DB',
    fontSize: 12,
    lineHeight: 17.5,
  },
  extraText: {
    color: '#D1D5DB',
    fontSize: 12,
    lineHeight: 18,
  },
  subParagraphText: {
    color: '#D1D5DB',
    fontSize: 12,
    lineHeight: 17.5,
  },
  feedingList: {
    gap: 7,
  },
  feedingRow: {
    backgroundColor: '#11141B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 9,
    gap: 7,
  },
  feedingRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feedingWeight: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  feedingCostPill: {
    backgroundColor: 'rgba(212, 175, 55, 0.16)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
  },
  feedingCostText: {
    color: colors.primary.light,
    fontSize: 11,
    fontWeight: '800',
  },
  feedingRationPair: {
    flexDirection: 'row',
    gap: 7,
  },
  feedingRationBox: {
    flex: 1,
    backgroundColor: '#171A23',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  feedingRationLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  feedingRationValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  subFootnoteText: {
    color: '#9CA3AF',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
});
