import React from 'react';
import { Card, Space, Tag } from 'antd';

export const performancePalette = {
  page: 'linear-gradient(180deg, #f5f8fc 0%, #eef3f8 100%)',
  surface: '#0f172a',
  cyan: '#22c7ee',
  blue: '#3b82f6',
  indigo: '#6366f1',
  pink: '#f472b6',
  amber: '#f59e0b',
  green: '#22c55e',
  text: '#0f172a',
  subtle: '#475569',
  border: '#dbe6f3',
};

export const performancePanelStyle = {
  borderRadius: 20,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.06)',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,251,255,0.98) 100%)',
  overflow: 'hidden',
};

export const performanceInsetPanelStyle = {
  borderRadius: 20,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
};

export const performanceTableCardStyle = {
  ...performancePanelStyle,
  paddingBottom: 8,
};

export const heroMetricCardStyle = {
  minHeight: 110,
  borderRadius: 18,
  border: '1px solid rgba(191, 219, 254, 0.55)',
  background: 'linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)',
  color: '#0f172a',
  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.05)',
};

export const railPanelStyle = {
  height: '100%',
  borderRadius: 22,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%)',
  boxShadow: '0 12px 28px rgba(15, 23, 42, 0.06)',
  color: '#0f172a',
};

export const stepCanvasStyle = {
  minHeight: 620,
  borderRadius: 22,
  border: '1px solid rgba(148, 163, 184, 0.16)',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(247,250,255,0.98) 100%)',
  boxShadow: '0 12px 28px rgba(15, 23, 42, 0.06)',
  padding: 28,
};

export const SectionTag = ({ children, color = performancePalette.indigo }) => (
  <Tag
    style={{
      marginInlineEnd: 0,
      borderRadius: 999,
      borderColor: `${color}22`,
      background: `${color}14`,
      color,
      paddingInline: 12,
      lineHeight: '26px',
      fontWeight: 600,
    }}
  >
    {children}
  </Tag>
);

export const MetricHeroCard = ({ label, value, hint, accent = performancePalette.cyan }) => (
  <div style={{ ...heroMetricCardStyle, position: 'relative', padding: 20 }}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle at top right, ${accent}16, transparent 32%)`,
        pointerEvents: 'none',
      }}
    />
    <Space direction="vertical" size={8} style={{ width: '100%', position: 'relative' }}>
      <span style={{ color: '#64748b', fontSize: 12, letterSpacing: 0.3 }}>{label}</span>
      <span style={{ fontSize: 30, lineHeight: 1.1, fontWeight: 700 }}>{value}</span>
      <span style={{ color: '#64748b', fontSize: 12 }}>{hint}</span>
    </Space>
  </div>
);

export const PerformanceHero = ({ eyebrow, title, description, actions, metrics }) => (
  <Card
    bordered={false}
    bodyStyle={{ padding: 28 }}
    style={{
      ...performancePanelStyle,
      background: 'linear-gradient(135deg, #ffffff 0%, #f7fbff 55%, #eef6ff 100%)',
      color: '#0f172a',
      marginBottom: 20,
    }}
  >
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 18,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 10% 10%, rgba(34, 199, 238, 0.08), transparent 30%), radial-gradient(circle at 90% 30%, rgba(59, 130, 246, 0.08), transparent 24%)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Space direction="vertical" size={10} style={{ maxWidth: 760 }}>
            <SectionTag color={performancePalette.cyan}>{eyebrow}</SectionTag>
            <div style={{ fontSize: 34, lineHeight: 1.15, fontWeight: 700 }}>{title}</div>
            <div style={{ color: '#475569', fontSize: 15, lineHeight: 1.7 }}>{description}</div>
          </Space>
          <div>{actions}</div>
        </div>
        {metrics?.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(metrics.length, 4)}, minmax(0, 1fr))`, gap: 16, marginTop: 24 }}>
            {metrics.map((item) => (
              <MetricHeroCard
                key={item.label}
                label={item.label}
                value={item.value}
                hint={item.hint}
                accent={item.accent}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  </Card>
);

export const PerformanceToolbar = ({ children, extra }) => (
  <Card bordered={false} bodyStyle={{ padding: 22 }} style={{ ...performancePanelStyle, marginBottom: 18 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 280 }}>{children}</div>
      {extra ? <div>{extra}</div> : null}
    </div>
  </Card>
);

export const PerformanceDataTableCard = ({ title, description, extra, children }) => (
  <Card bordered={false} bodyStyle={{ padding: 0 }} style={performanceTableCardStyle}>
    {(title || description || extra) ? (
      <div style={{ padding: '22px 24px 12px', borderBottom: '1px solid rgba(226, 232, 240, 0.8)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Space direction="vertical" size={4}>
            {title ? <span style={{ fontSize: 18, fontWeight: 700, color: performancePalette.text }}>{title}</span> : null}
            {description ? <span style={{ color: performancePalette.subtle, fontSize: 13 }}>{description}</span> : null}
          </Space>
          {extra}
        </div>
      </div>
    ) : null}
    <div style={{ padding: '0 12px 12px' }}>{children}</div>
  </Card>
);

export const PerformanceModalFrame = ({ rail, children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: 22, alignItems: 'stretch' }}>
    <div style={railPanelStyle}>{rail}</div>
    <div style={stepCanvasStyle}>{children}</div>
  </div>
);
