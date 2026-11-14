import { motion } from "framer-motion"

export function FieldDrawIcon({ done = false }: { done?: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 48 48"
      className="h-10 w-10 text-[#4E633D]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      whileHover={{ scale: 1.08 }}
    >
      <rect x="6" y="6" width="36" height="36" rx="8" className="fill-[#4E633D]/10 stroke-[#4E633D]/20" strokeWidth="1.5" />
      <motion.polygon
        points="14,14 34,18 30,34 16,30"
        className="fill-[#4E633D]/25 stroke-[#4E633D]"
        strokeWidth="2"
        strokeLinejoin="round"
        initial={{ pathLength: 0.8 }}
        animate={{ pathLength: [0.8, 1, 0.8] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle
        cx="14"
        cy="14"
        r="3"
        className="fill-white stroke-[#4E633D]"
        strokeWidth="2"
        animate={{ scale: [1, 1.25, 1] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0 }}
      />
      <motion.circle
        cx="34"
        cy="18"
        r="3"
        className="fill-white stroke-[#4E633D]"
        strokeWidth="2"
        animate={{ scale: [1, 1.25, 1] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      />
      <motion.circle
        cx="30"
        cy="34"
        r="3"
        className="fill-white stroke-[#4E633D]"
        strokeWidth="2"
        animate={{ scale: [1, 1.25, 1] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
      />
      <motion.circle
        cx="16"
        cy="30"
        r="3"
        className="fill-white stroke-[#4E633D]"
        strokeWidth="2"
        animate={{ scale: [1, 1.25, 1] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
      />
      {done && (
        <motion.circle
          cx="38"
          cy="10"
          r="4"
          className="fill-[#4E633D]"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        />
      )}
    </motion.svg>
  )
}

export function FarmDetailsIcon({ done = false }: { done?: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 48 48"
      className="h-10 w-10 text-[#4E633D]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      whileHover={{ scale: 1.08 }}
    >
      <rect x="6" y="6" width="36" height="36" rx="8" className="fill-[#7E9167]/10 stroke-[#7E9167]/20" strokeWidth="1.5" />
      <ellipse cx="24" cy="36" rx="14" ry="4" className="fill-[#A66843]/30" />
      <motion.path
        d="M24 35V20"
        className="stroke-[#4E633D]"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0.9 }}
        animate={{ pathLength: [0.85, 1, 0.85] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M24 24C28 20 33 21 34 25C30 27 26 26 24 24Z"
        className="fill-[#7E9167] stroke-[#4E633D]"
        strokeWidth="1.5"
        animate={{ rotate: [0, 4, 0, -4, 0], originX: "24px", originY: "24px" }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M24 20C20 16 15 17 14 21C18 23 22 22 24 20Z"
        className="fill-[#4E633D] stroke-[#4E633D]"
        strokeWidth="1.5"
        animate={{ rotate: [0, -4, 0, 4, 0], originX: "24px", originY: "20px" }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      />
      <motion.circle
        cx="24"
        cy="15"
        r="1.8"
        className="fill-[#A66843]"
        animate={{ y: [0, -3, 0], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
      {done && (
        <motion.circle
          cx="38"
          cy="10"
          r="4"
          className="fill-[#4E633D]"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        />
      )}
    </motion.svg>
  )
}

export function InvestigationIcon({ done = false }: { done?: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 48 48"
      className="h-10 w-10 text-[#2563EB]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      whileHover={{ scale: 1.08 }}
    >
      <rect x="6" y="6" width="36" height="36" rx="8" className="fill-[#2563EB]/10 stroke-[#2563EB]/20" strokeWidth="1.5" />
      <motion.g
        animate={{ rotate: [0, 6, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "24px 18px" }}
      >
        <rect x="20" y="14" width="8" height="8" rx="1.5" className="fill-[#1D4ED8] stroke-[#172554]" strokeWidth="1.5" />
        <line x1="12" y1="18" x2="20" y2="18" className="stroke-[#2563EB]" strokeWidth="2" strokeLinecap="round" />
        <rect x="10" y="15" width="4" height="6" rx="1" className="fill-[#60A5FA] stroke-[#2563EB]" strokeWidth="1" />
        <line x1="28" y1="18" x2="36" y2="18" className="stroke-[#2563EB]" strokeWidth="2" strokeLinecap="round" />
        <rect x="34" y="15" width="4" height="6" rx="1" className="fill-[#60A5FA] stroke-[#2563EB]" strokeWidth="1" />
      </motion.g>
      <motion.path
        d="M17 28C21.5 32 26.5 32 31 28"
        className="stroke-[#2563EB]"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeDasharray="2 3"
        animate={{ opacity: [0.3, 1, 0.3], y: [0, 2, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M13 33C20 38 28 38 35 33"
        className="stroke-[#3B82F6]"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeDasharray="2 3"
        animate={{ opacity: [0.2, 0.9, 0.2], y: [0, 3, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      />
      <motion.circle
        cx="24"
        cy="39"
        r="2"
        className="fill-[#2563EB]"
        animate={{ scale: [1, 1.6, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.6, repeat: Infinity, delay: 0.6 }}
      />
      {done && (
        <motion.circle
          cx="38"
          cy="10"
          r="4"
          className="fill-[#2563EB]"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        />
      )}
    </motion.svg>
  )
}

export function RotationCycleIcon({ done = false }: { done?: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 48 48"
      className="h-10 w-10 text-[#4E633D]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      whileHover={{ scale: 1.08 }}
    >
      <rect x="6" y="6" width="36" height="36" rx="8" className="fill-[#4E633D]/10 stroke-[#4E633D]/20" strokeWidth="1.5" />
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "24px 24px" }}
      >
        <path
          d="M24 13A11 11 0 0 1 35 24"
          className="stroke-[#4E633D]"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <polygon points="35,21 38,25 33,26" className="fill-[#4E633D]" />
        <path
          d="M35 24A11 11 0 0 1 24 35"
          className="stroke-[#7E9167]"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <polygon points="21,35 25,38 26,33" className="fill-[#7E9167]" />
        <path
          d="M24 35A11 11 0 0 1 13 24"
          className="stroke-[#A66843]"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <polygon points="13,27 10,23 15,22" className="fill-[#A66843]" />
      </motion.g>
      <circle cx="24" cy="24" r="4.5" className="fill-white stroke-[#4E633D]" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="2" className="fill-[#4E633D]" />
      {done && (
        <motion.circle
          cx="38"
          cy="10"
          r="4"
          className="fill-[#4E633D]"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        />
      )}
    </motion.svg>
  )
}

export function ReportCertIcon({ done = false }: { done?: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 48 48"
      className="h-10 w-10 text-[#4E633D]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      whileHover={{ scale: 1.08 }}
    >
      <rect x="6" y="6" width="36" height="36" rx="8" className="fill-[#4E633D]/10 stroke-[#4E633D]/20" strokeWidth="1.5" />
      <rect x="14" y="11" width="20" height="26" rx="3" className="fill-white stroke-[#4E633D]" strokeWidth="1.8" />
      <line x1="19" y1="17" x2="29" y2="17" className="stroke-[#4E633D]" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="19" y1="21" x2="26" y2="21" className="stroke-[#7E9167]" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="19" y1="25" x2="28" y2="25" className="stroke-[#5C5A52]/50" strokeWidth="1.5" strokeLinecap="round" />
      <motion.circle
        cx="29"
        cy="31"
        r="4.5"
        className="fill-[#4E633D] stroke-white"
        strokeWidth="1.5"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <polyline points="27.5,31 28.5,32 30.5,30" className="stroke-white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      {done && (
        <motion.circle
          cx="38"
          cy="10"
          r="4"
          className="fill-[#4E633D]"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        />
      )}
    </motion.svg>
  )
}
