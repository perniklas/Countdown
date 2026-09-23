import { useId, type CSSProperties } from 'react'
import type { ValheimBiome } from '../domain/countdown'

const PINES = [24, 96, 168, 255, 340, 445, 550, 680, 790, 910, 1030, 1135, 1250, 1340, 1465, 1555]

/** The supplied canvases share one frame: 1 is nearest and must always be on top. */
const MEADOWS_LAYERS = [
  { id: 7, movement: 5 },
  { id: 6, movement: 10 },
  { id: 5, movement: 18 },
  { id: 4, movement: 28 },
  { id: 3, movement: 40 },
  { id: 2, movement: 54 },
  { id: 1, movement: 70 },
] as const

function MeadowsPhotoScene() {
  return (
    <div className="valheim-scene valheim-photo" aria-hidden="true">
      {MEADOWS_LAYERS.map((layer) => (
        <img
          key={layer.id}
          className="vh-photo-layer"
          data-layer={layer.id}
          src={`/valheim/${layer.id}.png`}
          alt=""
          draggable={false}
          style={{ '--layer-movement': `${layer.movement}px` } as CSSProperties}
        />
      ))}
      <div className="vh-photo-scrim" />
      <div className="vh-weather">
        {Array.from({ length: 22 }, (_, i) => (
          <i key={i} style={{
            '--x': ((i * 137 + 17) % 100) + '%',
            '--y': ((i * 71 + 9) % 100) + '%',
            '--delay': -(i * 0.73) + 's',
            '--duration': (9 + i % 7) + 's',
            '--size': (2 + i % 3) + 'px',
          } as CSSProperties} />
        ))}
      </div>
      <div className="vh-vignette" />
    </div>
  )
}

/** Original low-poly landscapes. All geometry is deterministic and decorative. */
export function ValheimScene({ biome }: { biome: ValheimBiome }) {
  const id = useId().replace(/:/g, '')
  const pine = id + '-pine'
  const oak = id + '-oak'
  const birch = id + '-birch'
  const dead = id + '-dead'
  const grass = id + '-grass'
  const isMeadows = biome === 'meadows'
  const isForest = biome === 'black-forest'
  const isSwamp = biome === 'swamp'
  const isMountains = biome === 'mountains'
  const isPlains = biome === 'plains'

  if (isMeadows) return <MeadowsPhotoScene />

  return (
    <div className="valheim-scene" aria-hidden="true">
      <div className="vh-sky" />
      <div className="vh-stars" />
      <div className="vh-world-tree">
        <svg viewBox="0 0 1000 600" preserveAspectRatio="none">
          <path d="M1020 670Q700 320 565 25M817 433Q480 270 130 320M640 173Q390 140 175 20M726 308Q850 130 1030 72" />
          <path d="M450 297Q305 180 220 100M803 181Q845 30 818 -40M340 112Q215 148 35 99" />
        </svg>
      </div>
      <div className="vh-sun" />
      <div className="vh-rays" />
      <svg className="vh-landscape" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice">
        <defs>
          <g id={pine}>
            <path d="M-8 0L-5 -245H6L10 0Z" fill="#182c25" />
            <path d="M0 -365L-48 -253L-25 -256L-76 -172L-43 -177L-103 -80L-55 -94L-117 -24L2 -46L113 -18L64 -91L97 -77L46 -174L73 -164L25 -255L44 -248Z" fill="currentColor" />
            <path d="M0 -365L4 -45L113 -18L64 -91L97 -77L46 -174L73 -164L25 -255L44 -248Z" fill="#051d24" opacity=".2" />
          </g>
          <g id={oak}>
            <path d="M-24 5L-12 -240L-81 -312L-66 -319L3 -270L54 -347L68 -340L20 -233L30 5Z" fill="#39472c" />
            <path d="M-159 -244L-216 -307L-181 -380L-121 -394L-102 -447L-19 -477L60 -448L108 -461L179 -406L183 -357L230 -319L201 -263L126 -229L49 -245L-49 -218Z" fill="currentColor" />
            <path d="M-181 -380L-121 -394L-102 -447L-19 -477L60 -448L38 -383L-64 -340Z" fill="#d9d986" opacity=".32" />
            <path d="M-159 -244L-64 -340L38 -383L85 -302L201 -263L126 -229L49 -245L-49 -218Z" fill="#173d2a" opacity=".25" />
            <path d="M108 -461L179 -406L183 -357L85 -302L38 -383L60 -448Z" fill="#b7ce78" opacity=".22" />
          </g>
          <g id={birch}>
            <path d="M-8 0L-5 -331L5 -351L11 0Z" fill="#ddd9ae" />
            <path d="M-7 -57H7M-6 -126L7 -133M-6 -216H7M-4 -279L5 -283" stroke="#575d42" strokeWidth="7" />
            <path d="M0 -311L-39 -369L-28 -428L4 -455L43 -426L53 -367L24 -310Z" fill="currentColor" />
            <path d="M-28 -428L4 -455L15 -351L-39 -369Z" fill="#e3db97" opacity=".32" />
          </g>
          <g id={dead}>
            <path d="M-19 0L-13 -174L-35 -280L-25 -407L-7 -478L-11 -324L8 -221L29 -6Z" fill="currentColor" />
            <path d="M-4 -166L-76 -244L-99 -333L-85 -339L-60 -266L1 -228M-20 -302L47 -362L72 -454L82 -449L64 -338L-8 -270M-66 -262L-147 -285L-186 -352L-173 -351L-135 -303L-65 -292M41 -348L130 -386L164 -447L173 -440L143 -367L51 -324" fill="currentColor" />
            <path d="M-105 -292L-93 -178M71 -357L85 -220M119 -379L135 -292" fill="none" stroke="#647247" strokeWidth="6" opacity=".45" />
          </g>
          <g id={grass} fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M0 0Q3 -38 -12 -64M2 0Q17 -39 33 -48M0 0Q-13 -25 -30 -29M0 0Q0 -51 13 -76" />
          </g>
        </defs>
        {isMountains ? (
          <>
            <path fill="#657e98" d="M0 720L150 490L250 535L450 200L655 492L840 339L1070 553L1280 175L1600 663V1000H0Z" />
            <path fill="#cfdfdf" d="M250 535L450 200L655 492L512 401L465 365L430 415L403 361L335 479ZM1096 514L1280 175L1480 499L1341 389L1290 338L1244 390L1218 353Z" />
            <path fill="#91afc0" d="M450 200L512 401L655 492L561 342ZM1280 175L1341 389L1480 499Z" />
            <path fill="#344c66" d="M0 785L248 566L420 780L749 432L1001 766L1286 553L1600 807V1000H0Z" />
            <path fill="#e0e6db" d="M518 687L749 432L930 681L811 616L759 571L725 599L696 563L635 631Z" />
            <path fill="#829eaf" d="M749 432L759 571L811 616L930 681Z" />
            <path fill="#172f48" d="M0 831L140 740L371 905L572 827L787 914L1058 803L1248 873L1450 733L1600 812V1000H0Z" />
            <path fill="#acbec8" d="M0 831L140 740L371 905L230 850L164 804L126 830L75 809ZM1248 873L1450 733L1600 812L1501 804L1459 781L1395 823Z" />
            {[60, 1510, 1555, 125].map((x, i) => <use key={x} href={'#' + pine} transform={'translate(' + x + ' 990) scale(' + (.44 + i * .06) + ')'} color="#112b3b" />)}
          </>
        ) : (
          <>
            <path className="vh-ridge-far" d="M0 653L116 600L233 631L348 551L501 603L672 539L824 587L968 527L1110 576L1250 522L1400 598L1600 533V1000H0Z" />
            <path className="vh-ridge-mid" d="M0 720Q179 592 402 710Q610 794 816 660Q1017 551 1225 661Q1418 760 1600 617V1000H0Z" />
            {isForest && PINES.map((x, i) => <use key={x} href={'#' + pine} transform={'translate(' + x + ' 740) scale(' + (.65 + (i % 4) * .16) + ')'} color={i % 2 ? '#305259' : '#3d6266'} />)}
            {isSwamp ? <path className="vh-water" d="M0 742Q390 708 810 765T1600 739V1000H0Z" /> : <path className="vh-ridge-near" d="M0 807Q240 705 507 818Q800 933 1082 755Q1280 655 1600 801V1000H0Z" />}
            {isForest && (
              <>
                {[-10, 117, 245, 1335, 1470, 1600].map((x, i) => <use key={x} href={'#' + pine} transform={'translate(' + x + ' 925) scale(' + (1.6 + (i % 3) * .25) + ')'} color={i % 2 ? '#142f32' : '#193b3c'} />)}
                <path d="M1185 892L1204 784L1238 764L1262 795L1251 897Z" fill="#344947" />
                <path d="M1227 796L1217 829L1236 840L1221 869M1217 829L1237 815" stroke="#80bac0" strokeWidth="3" fill="none" opacity=".65" />
              </>
            )}
            {isSwamp && (
              <>
                {[50, 225, 1400, 1560].map((x, i) => <use key={x} href={'#' + dead} transform={'translate(' + x + ' 956) scale(' + (1 + i % 2 * .4) + ')'} color={i % 2 ? '#182c29' : '#26382c'} />)}
                {[410, 985, 1210].map((x) => <use key={x} href={'#' + dead} transform={'translate(' + x + ' 782) scale(.55)'} color="#495845" />)}
                <g stroke="#84906a" opacity=".28" fill="none">
                  <path d="M410 822H564M972 847H1302M650 900H898M49 955H535M1004 972H1426" strokeWidth="3" />
                  <ellipse cx="1120" cy="909" rx="89" ry="7" /><ellipse cx="411" cy="860" rx="41" ry="4" />
                </g>
                <path d="M0 966L134 935L287 967L346 1000H0ZM1300 1000L1449 932L1600 942V1000Z" fill="#172c29" />
              </>
            )}
            {isPlains && (
              <>
                <path d="M225 841L244 586L275 545L316 593L331 842Z" fill="#756746" />
                <path d="M244 586L275 545L281 832L225 841Z" fill="#a0966a" />
                <path d="M1242 784L1260 643L1292 621L1323 661L1311 785Z" fill="#897a53" />
                <path d="M1309 896L1341 741L1380 693L1427 747L1452 897Z" fill="#716042" />
                <path d="M1341 741L1380 693L1383 896H1309Z" fill="#a18c5b" />
                <path d="M0 937Q370 829 678 934T1600 916V1000H0Z" fill="#8c7943" />
              </>
            )}
          </>
        )}
        {!isMountains && !isSwamp && (
          <g className="vh-grasses">
            {Array.from({ length: 62 }, (_, i) => <use key={i} href={'#' + grass} transform={'translate(' + (i * 27) + ' ' + (995 + i % 4 * 9) + ') scale(' + (.65 + i % 5 * .18) + ')'} />)}
          </g>
        )}
      </svg>
      <div className="vh-mist" />
      <div className="vh-weather">
        {Array.from({ length: isSwamp ? 42 : 24 }, (_, i) => (
          <i key={i} style={{
            '--x': ((i * 137 + 17) % 100) + '%',
            '--y': ((i * 71 + 9) % 100) + '%',
            '--delay': -(i * .73) + 's',
            '--duration': (9 + i % 7) + 's',
            '--size': (2 + i % 3) + 'px',
          } as CSSProperties} />
        ))}
      </div>
      <div className="vh-vignette" />
    </div>
  )
}
