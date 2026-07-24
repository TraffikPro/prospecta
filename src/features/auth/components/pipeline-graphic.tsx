import { Box, type BoxProps } from "@chakra-ui/react";

const STAGES = [
  { cx: 72, label: "Lead", sub: "Identificado" },
  { cx: 204, label: "Contato", sub: "Qualificado" },
  { cx: 316, label: "Resultado", sub: "Registrado" },
  { cx: 420, label: "Próximo", sub: "Passo" },
] as const;

/** Decorative pipeline illustration for the login brand panel. */
export function PipelineGraphic(props: Omit<BoxProps, "children">) {
  return (
    <Box
      as="span"
      display="block"
      w="full"
      maxW="440px"
      lineHeight={0}
      aria-hidden
      {...props}
    >
      <svg
        viewBox="0 0 440 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="auto"
      >
        <path
          d="M72 130 Q148 80 204 130 Q260 180 316 130 Q372 80 420 130"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1.5"
          strokeDasharray="6 4"
          fill="none"
        />
        {STAGES.map(({ cx, label, sub }, i) => (
          <g key={label}>
            <circle
              cx={cx}
              cy={130}
              r={28}
              fill="rgba(255,255,255,0.05)"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1"
            />
            <circle
              cx={cx}
              cy={130}
              r={10}
              fill={
                i === 3 ? "rgba(13,148,136,0.9)" : "rgba(255,255,255,0.25)"
              }
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1"
            />
            {i < 3 ? (
              <path
                d={`M${cx + 30} 130 L${cx + 44} 130`}
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="1"
                markerEnd="url(#login-pipeline-arr)"
              />
            ) : null}
            <text
              x={cx}
              y={170}
              textAnchor="middle"
              fill="rgba(255,255,255,0.75)"
              fontSize="10"
              fontWeight="600"
              letterSpacing="0.04em"
            >
              {label.toUpperCase()}
            </text>
            <text
              x={cx}
              y={184}
              textAnchor="middle"
              fill="rgba(255,255,255,0.4)"
              fontSize="9"
            >
              {sub}
            </text>
          </g>
        ))}
        <defs>
          <marker
            id="login-pipeline-arr"
            markerWidth="6"
            markerHeight="6"
            refX="3"
            refY="3"
            orient="auto"
          >
            <path d="M0 0 L6 3 L0 6 Z" fill="rgba(255,255,255,0.25)" />
          </marker>
        </defs>
      </svg>
    </Box>
  );
}
