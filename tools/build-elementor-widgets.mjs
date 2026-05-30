import fs from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const pluginRoot = path.join(repoRoot, 'umoya-elementor-widgets');

const fcCategory = 'umoya-fc';
const homepageCategory = 'umoya-homepage';

const sections = [
  {
    key: 'fc_nav',
    source: 'section-00-nav.html',
    name: 'fc-nav',
    title: 'FC Navigation',
    className: 'FC_Nav',
    widgetFile: 'class-fc-nav.php',
    icon: 'eicon-nav-menu',
    category: fcCategory,
  },
  {
    key: 'fc_hero',
    source: 'section-01-hero.html',
    name: 'fc-hero',
    title: 'FC Hero',
    className: 'FC_Hero',
    widgetFile: 'class-fc-hero.php',
    icon: 'eicon-banner',
    category: fcCategory,
  },
  {
    key: 'fc_intro',
    source: 'section-02-intro.html',
    name: 'fc-intro',
    title: 'FC Intro',
    className: 'FC_Intro',
    widgetFile: 'class-fc-intro.php',
    icon: 'eicon-info-circle-o',
    category: fcCategory,
  },
  {
    key: 'fc_form',
    source: 'section-02-form.html',
    name: 'fc-form',
    title: 'FC Inquiry Form',
    className: 'FC_Form',
    widgetFile: 'class-fc-form.php',
    icon: 'eicon-form-horizontal',
    category: fcCategory,
  },
  {
    key: 'fc_be_first',
    source: 'section-03-be-first.html',
    name: 'fc-be-first',
    title: 'FC Be First',
    className: 'FC_Be_First',
    widgetFile: 'class-fc-be-first.php',
    icon: 'eicon-star',
    category: fcCategory,
  },
  {
    key: 'fc_benefits',
    source: 'section-04-benefits.html',
    name: 'fc-benefits',
    title: 'FC Benefits',
    className: 'FC_Benefits',
    widgetFile: 'class-fc-benefits.php',
    icon: 'eicon-check-circle',
    category: fcCategory,
  },
  {
    key: 'fc_journey',
    source: 'section-05-journey.html',
    name: 'fc-journey-header',
    title: 'FC Journey',
    className: 'FC_Journey_Header',
    widgetFile: 'class-fc-journey-header.php',
    icon: 'eicon-map-pin',
    category: fcCategory,
  },
  {
    key: 'fc_journey_interactive_map_image',
    source: 'section-05-journey-interactive-map-image.html',
    name: 'fc-journey-interactive-map-image',
    title: 'FC Journey Interactive Map Image',
    className: 'FC_Journey_Interactive_Map_Image',
    widgetFile: 'class-fc-journey-interactive-map-image.php',
    icon: 'eicon-map-pin',
    category: fcCategory,
  },
  {
    key: 'fc_journey_map_snapshot',
    source: 'section-05-journey-map-snapshot.html',
    name: 'fc-journey-map-snapshot',
    title: 'FC Journey Map Snapshot',
    className: 'FC_Journey_Map_Snapshot',
    widgetFile: 'class-fc-journey-map-snapshot.php',
    icon: 'eicon-map-pin',
    category: fcCategory,
  },
  {
    key: 'fc_journey_no_map',
    source: 'section-05-journey-no-map.html',
    name: 'fc-journey-no-map',
    title: 'FC Journey No Map',
    className: 'FC_Journey_No_Map',
    widgetFile: 'class-fc-journey-no-map.php',
    icon: 'eicon-map-pin',
    category: fcCategory,
  },
  {
    key: 'fc_map',
    source: 'section-05-map.html',
    name: 'fc-map',
    title: 'FC Route Map',
    className: 'FC_Map',
    widgetFile: 'class-fc-map.php',
    icon: 'eicon-map-pin',
    category: fcCategory,
  },
  {
    key: 'fc_pricing',
    source: 'section-05a-pricing.html',
    name: 'fc-pricing',
    title: 'FC Pricing',
    className: 'FC_Pricing',
    widgetFile: 'class-fc-pricing.php',
    icon: 'eicon-price-table',
    category: fcCategory,
  },
  {
    key: 'fc_cta',
    source: 'section-05b-cta.html',
    name: 'fc-cta',
    title: 'FC CTA',
    className: 'FC_CTA',
    widgetFile: 'class-fc-cta.php',
    icon: 'eicon-call-to-action',
    category: fcCategory,
  },
  {
    key: 'fc_why',
    source: 'section-06-why.html',
    name: 'fc-why',
    title: 'FC Why Umoya',
    className: 'FC_Why',
    widgetFile: 'class-fc-why.php',
    icon: 'eicon-heart-o',
    category: fcCategory,
  },
  {
    key: 'fc_pillars',
    source: 'section-06b-pillars.html',
    name: 'fc-pillars',
    title: 'FC Pillars',
    className: 'FC_Pillars',
    widgetFile: 'class-fc-pillars.php',
    icon: 'eicon-columns',
    category: fcCategory,
  },
  {
    key: 'fc_details',
    source: 'section-07-details.html',
    name: 'fc-details',
    title: 'FC Travel Essentials',
    className: 'FC_Details',
    widgetFile: 'class-fc-details.php',
    icon: 'eicon-accordion',
    category: fcCategory,
  },
  {
    key: 'homepage_form_popup',
    source: 'homepage/homepage-form-popup.html',
    name: 'umoya-homepage-form-popup',
    title: 'Homepage Form Popup',
    className: 'Homepage_Form_Popup',
    widgetFile: 'class-homepage-form-popup.php',
    icon: 'eicon-form-horizontal',
    category: homepageCategory,
  },
  {
    key: 'homepage_nav',
    source: 'homepage/homepage-section-00-nav.html',
    name: 'umoya-homepage-nav',
    title: 'Homepage Navigation',
    className: 'Homepage_Nav',
    widgetFile: 'class-homepage-nav.php',
    icon: 'eicon-nav-menu',
    category: homepageCategory,
  },
  {
    key: 'homepage_hero',
    source: 'homepage/homepage-section-01-hero.html',
    name: 'umoya-homepage-hero',
    title: 'Homepage Hero',
    className: 'Homepage_Hero',
    widgetFile: 'class-homepage-hero.php',
    icon: 'eicon-banner',
    category: homepageCategory,
  },
  {
    key: 'homepage_about',
    source: 'homepage/homepage-section-02-about.html',
    name: 'umoya-homepage-about',
    title: 'Homepage About',
    className: 'Homepage_About',
    widgetFile: 'class-homepage-about.php',
    icon: 'eicon-info-circle-o',
    category: homepageCategory,
  },
  {
    key: 'homepage_homecoming',
    source: 'homepage/homepage-section-03-homecoming.html',
    name: 'umoya-homepage-homecoming',
    title: 'Homepage Homecoming Journey',
    className: 'Homepage_Homecoming',
    widgetFile: 'class-homepage-homecoming.php',
    icon: 'eicon-slider-album',
    category: homepageCategory,
  },
  {
    key: 'homepage_founder_cta',
    source: 'homepage/homepage-section-04-founder-cta.html',
    name: 'umoya-homepage-founder-cta',
    title: 'Homepage Founder CTA',
    className: 'Homepage_Founder_CTA',
    widgetFile: 'class-homepage-founder-cta.php',
    icon: 'eicon-call-to-action',
    category: homepageCategory,
  },
  {
    key: 'homepage_pricing',
    source: 'homepage/homepage-section-05a-pricing.html',
    name: 'umoya-homepage-pricing',
    title: 'Homepage Pricing',
    className: 'Homepage_Pricing',
    widgetFile: 'class-homepage-pricing.php',
    icon: 'eicon-price-table',
    category: homepageCategory,
  },
  {
    key: 'homepage_accommodations',
    source: 'homepage/homepage-section-06-accommodations.html',
    name: 'umoya-homepage-accommodations',
    title: 'Homepage Accommodations',
    className: 'Homepage_Accommodations',
    widgetFile: 'class-homepage-accommodations.php',
    icon: 'eicon-gallery-grid',
    category: homepageCategory,
  },
  {
    key: 'homepage_pillars',
    source: 'homepage/homepage-section-06b-pillars.html',
    name: 'umoya-homepage-pillars',
    title: 'Homepage Pillars',
    className: 'Homepage_Pillars',
    widgetFile: 'class-homepage-pillars.php',
    icon: 'eicon-columns',
    category: homepageCategory,
  },
  {
    key: 'homepage_details',
    source: 'homepage/homepage-section-07-details.html',
    name: 'umoya-homepage-details',
    title: 'Homepage Travel Essentials',
    className: 'Homepage_Details',
    widgetFile: 'class-homepage-details.php',
    icon: 'eicon-accordion',
    category: homepageCategory,
  },
];

const editableAttrs = [
  'href',
  'src',
  'poster',
  'alt',
  'aria-label',
  'placeholder',
  'value',
  'action',
  'data-hubspot-portal-id',
  'data-hubspot-form-id',
  'data-hubspot-consent-text',
  'data-umoya-form-source',
  'data-wordpress-backup-endpoint',
];

const attrRegex = new RegExp(`\\b(${editableAttrs.map(escapeRegex).join('|')})\\s*=\\s*(["'])([\\s\\S]*?)\\2`, 'gi');

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readText(file) {
  return fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
}

function writeText(file, content) {
  ensureDir(path.dirname(file));
  const normalized = content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n');
  fs.writeFileSync(file, normalized, 'utf8');
}

function decodeEntities(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function stripTags(value) {
  return decodeEntities(value.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function preview(value, limit = 62) {
  const clean = stripTags(String(value));
  return clean.length > limit ? `${clean.slice(0, limit - 1)}...` : clean;
}

function slugPart(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 32);
}

function isImageUrl(value) {
  return /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(value);
}

function isVideoUrl(value) {
  return /\.(?:mp4|mov|m4v|webm|ogg)(?:[?#].*)?$/i.test(value);
}

function getOpeningTagAt(markup, offset) {
  const start = markup.lastIndexOf('<', offset);
  const end = markup.indexOf('>', start);
  if (start < 0 || end < 0 || end < offset) return '';
  return markup.slice(start, end + 1);
}

function getLastTagBefore(markup, offset) {
  const start = markup.lastIndexOf('<', offset);
  const end = markup.indexOf('>', start);
  if (start < 0 || end < 0 || end > offset) return '';
  return markup.slice(start, end + 1);
}

function getTagName(tag) {
  const match = tag.match(/^<\/?\s*([a-z0-9:-]+)/i);
  return match ? match[1].toLowerCase() : '';
}

function getAttr(tag, name) {
  const re = new RegExp(`\\b${escapeRegex(name)}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i');
  const match = tag.match(re);
  return match ? decodeEntities(match[2]) : '';
}

function getInputType(tag) {
  return getAttr(tag, 'type').toLowerCase();
}

function controlKindForAttr(attr, value, tag) {
  const lower = attr.toLowerCase();
  if (lower === 'href' || lower === 'action' || lower === 'data-wordpress-backup-endpoint') return 'url';
  if ((lower === 'src' || lower === 'poster') && isVideoUrl(value)) return 'url';
  if ((lower === 'src' || lower === 'poster') && (/^https?:\/\//i.test(value) || isImageUrl(value))) return 'media';
  if (lower.startsWith('data-hubspot') || lower === 'data-umoya-form-source') return 'integration';
  if (lower === 'value' && getInputType(tag) === 'hidden') return 'integration';
  return 'attribute';
}

function logicalAttrKey(attr, value, tag) {
  const lower = attr.toLowerCase();
  if (lower === 'value' && getInputType(tag) === 'hidden') {
    const name = getAttr(tag, 'name').toLowerCase();
    if (name === 'source') return 'form_source';
    if (name === 'hubspotportalid') return 'hubspot_portal_id';
    if (name === 'hubspotformid') return 'hubspot_form_id';
    if (name === 'consenttext') return 'hubspot_consent_text';
  }
  if (lower === 'data-umoya-form-source') return 'form_source';
  if (lower === 'data-hubspot-portal-id') return 'hubspot_portal_id';
  if (lower === 'data-hubspot-form-id') return 'hubspot_form_id';
  if (lower === 'data-hubspot-consent-text') return 'hubspot_consent_text';
  return `${lower}:${decodeEntities(value)}`;
}

function shouldEditAttr(attr, value, tag) {
  const tagName = getTagName(tag);
  const lower = attr.toLowerCase();
  if (!value) return false;
  if (tagName === 'option') return false;
  if (lower === 'value' && getInputType(tag) !== 'hidden') return false;
  if (value.startsWith('data:image/svg+xml')) return false;
  return true;
}

function shouldEditText(core, previousTag) {
  if (!core || core.length < 2) return false;
  if (/<!--|-->/.test(core)) return false;
  if (/^[*|/\\\-–—•·.]+$/.test(core)) return false;
  const tagName = getTagName(previousTag);
  if (['option', 'script', 'style', 'svg', 'path', 'line', 'polyline', 'defs'].includes(tagName)) return false;
  return true;
}

function makePlaceholder(sectionKey, id) {
  return `%%UEW_${sectionKey.toUpperCase()}_${id.toUpperCase()}%%`;
}

function extractRootSelector(markup) {
  const match = markup.match(/<(section|nav|div|header|footer|main)\b([^>]*)>/i);
  if (!match) return '';
  const tag = match[1].toLowerCase();
  const attrs = match[2] || '';
  const id = (attrs.match(/\bid\s*=\s*(["'])(.*?)\1/i) || [])[2];
  if (id) return `#${id}`;
  const classes = (attrs.match(/\bclass\s*=\s*(["'])(.*?)\1/i) || [])[2];
  if (classes) return `.${classes.trim().split(/\s+/)[0]}`;
  return tag;
}

function extractCssVars(css) {
  const vars = [];
  const seen = new Set();
  const colorLike = /#(?:[0-9a-f]{3,8})\b|rgba?\(|hsla?\(|\b(?:white|black|transparent|currentColor)\b/i;
  let match;
  const re = /--([a-zA-Z0-9_-]+)\s*:\s*([^;{}]+);/g;
  while ((match = re.exec(css)) !== null) {
    const name = match[1];
    const value = match[2].trim();
    if (seen.has(name) || !colorLike.test(value)) continue;
    seen.add(name);
    vars.push({ name, default: value });
  }
  return vars;
}

function splitHtml(raw) {
  const styles = [];
  const scripts = [];
  const comments = [];
  let working = raw.replace(/<!--[\s\S]*?-->/g, (comment) => {
    const index = comments.push(comment) - 1;
    return `<!--UEW_SPLIT_COMMENT_${index}-->`;
  });

  let markup = working.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (_, css) => {
    styles.push(css.trim());
    return '';
  });

  markup = markup.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (_, js) => {
    scripts.push(js.trim());
    return '';
  });

  markup = markup.replace(/<!--UEW_SPLIT_COMMENT_(\d+)-->/g, (_, index) => comments[Number(index)] || '');

  return {
    markup: markup.replace(/\n{3,}/g, '\n\n').trim() + '\n',
    css: styles.join('\n\n').trim() + (styles.length ? '\n' : ''),
    js: scripts.join('\n\n').trim() + (scripts.length ? '\n' : ''),
  };
}

function editableTemplate(section, markup) {
  const fields = [];
  const byLogical = new Map();
  let attrCount = 0;
  let textCount = 0;
  const comments = [];
  const workingMarkup = markup.replace(/<!--[\s\S]*?-->/g, (comment) => {
    const index = comments.push(comment) - 1;
    return `<!--UEW_COMMENT_${index}-->`;
  });

  function addField(field) {
    fields.push(field);
    return field;
  }

  let output = workingMarkup.replace(attrRegex, (full, attr, quote, rawValue, offset) => {
    const tag = getOpeningTagAt(workingMarkup, offset);
    if (!shouldEditAttr(attr, rawValue, tag)) return full;

    const decoded = decodeEntities(rawValue);
    const kind = controlKindForAttr(attr, decoded, tag);
    const logical = logicalAttrKey(attr, decoded, tag);
    const logicalKey = `${kind}:${logical}:${decoded}`;

    let field = byLogical.get(logicalKey);
    if (!field) {
      attrCount += 1;
      const labelStem = attr
        .replace(/^data-/, '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (m) => m.toUpperCase());
      const id = `${kind === 'media' ? 'media' : kind === 'url' ? 'url' : kind === 'integration' ? 'int' : 'attr'}_${String(attrCount).padStart(3, '0')}_${slugPart(labelStem)}`;
      field = addField({
        id,
        kind,
        label: `${labelStem}: ${preview(decoded)}`,
        default: decoded,
        raw_default: rawValue,
        attr: attr.toLowerCase(),
        placeholder: makePlaceholder(section.key, id),
      });
      byLogical.set(logicalKey, field);
    }

    return `${attr}=${quote}${field.placeholder}${quote}`;
  });

  output = output.replace(/>([^<]+)</g, (full, text, offset) => {
    const core = text.trim();
    const previousTag = getLastTagBefore(output, offset + 1);
    if (!shouldEditText(core, previousTag)) return full;

    const decoded = decodeEntities(core);
    const logicalKey = `text:${decoded}`;
    let field = byLogical.get(logicalKey);
    if (!field) {
      textCount += 1;
      const id = `text_${String(textCount).padStart(3, '0')}`;
      field = addField({
        id,
        kind: decoded.length > 84 ? 'textarea' : 'text',
        label: `Text: ${preview(decoded)}`,
        default: decoded,
        raw_default: core,
        placeholder: makePlaceholder(section.key, id),
      });
      byLogical.set(logicalKey, field);
    }

    const leading = text.match(/^\s*/)?.[0] || '';
    const trailing = text.match(/\s*$/)?.[0] || '';
    return `>${leading}${field.placeholder}${trailing}<`;
  });

  output = output.replace(/<!--UEW_COMMENT_(\d+)-->/g, (_, index) => comments[Number(index)] || '');

  const reverse = new Map(fields.map((field) => [field.placeholder, field.raw_default ?? field.default]));
  const roundTrip = output.replace(/%%UEW_[A-Z0-9_]+%%/g, (marker) => reverse.get(marker) ?? marker);
  if (decodeEntities(roundTrip) !== decodeEntities(markup)) {
    throw new Error(`Template round trip failed for ${section.source}`);
  }

  return { markup: output, fields };
}

function widgetClass(section) {
  return `<?php
namespace Umoya_EW\\Widgets;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class ${section.className} extends \\Umoya_EW\\Base_Widget {

    protected function section_key() {
        return '${section.key}';
    }
}
`;
}

function templateWrapper(section) {
  return `<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$this->render_editable_section( '${section.key}' );
`;
}

const generated = {};

for (const section of sections) {
  const sourcePath = path.join(repoRoot, section.source);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing source file: ${section.source}`);
  }

  const raw = readText(sourcePath);
  const split = splitHtml(raw);
  const templated = editableTemplate(section, split.markup);
  const rootSelector = extractRootSelector(split.markup);
  const cssVars = extractCssVars(split.css);
  const fields = templated.fields.map(({ raw_default, ...field }) => field);

  const cssRel = `assets/css/sections/${section.key}.css`;
  const jsRel = `assets/js/sections/${section.key}.js`;
  const htmlRel = `templates/html/${section.key}.html`;

  writeText(path.join(pluginRoot, cssRel), split.css);
  writeText(path.join(pluginRoot, jsRel), split.js);
  writeText(path.join(pluginRoot, htmlRel), templated.markup);
  writeText(path.join(pluginRoot, 'widgets', section.widgetFile), widgetClass(section));
  writeText(path.join(pluginRoot, 'templates', `${path.basename(section.source, '.html')}.php`), templateWrapper(section));

  generated[section.key] = {
    key: section.key,
    source: section.source,
    name: section.name,
    title: section.title,
    class_name: section.className,
    widget_file: section.widgetFile,
    icon: section.icon,
    category: section.category,
    template: htmlRel,
    style_handle: `uew-${section.name}`,
    style_file: cssRel,
    script_handle: split.js.trim() ? `uew-${section.name}` : '',
    script_file: split.js.trim() ? jsRel : '',
    root_selector: rootSelector,
    css_vars: cssVars,
    fields,
    keywords: [
      'umoya',
      section.category === homepageCategory ? 'homepage' : 'founders circle',
      ...section.title.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean),
    ],
  };
}

writeText(
  path.join(pluginRoot, 'includes', 'section-definitions.json'),
  `${JSON.stringify(generated, null, 2)}\n`
);

console.log(`Generated ${sections.length} Elementor section widgets.`);
