/** Origin, insertion and arterial supply for the muscles in structure-facts.ts, keyed by fact id.
 *  The three lines a student recites for every muscle ("origo, insertio, vascularisatio") are written in Latin
 *  after Terminologia Anatomica: Mongolian anatomy courses teach them that way, so the card shows the same words
 *  in both interface languages. Like the rest of the curated text, they need review by an anatomy instructor. */

export interface MuscleAttachments {
  origin: string;
  insertion: string;
  artery: string;
}

const A: Record<string, MuscleAttachments> = {
  // Shoulder girdle and axilla
  deltoid: {origin: 'Pars acromialis claviculae (1/3 lateralis), acromion, spina scapulae', insertion: 'Tuberositas deltoidea humeri', artery: 'A. thoracoacromialis (r. deltoideus), a. circumflexa humeri posterior'},
  'pectoralis-major': {origin: 'Clavicula (1/2 medialis), sternum, cartilagines costales I–VI, vagina m. recti abdominis', insertion: 'Crista tuberculi majoris humeri', artery: 'A. thoracoacromialis (rr. pectorales), rr. perforantes a. thoracicae internae, a. thoracica lateralis'},
  'latissimus-dorsi': {origin: 'Processus spinosi T7–L5 (fascia thoracolumbalis), os sacrum, crista iliaca, costae IX–XII', insertion: 'Crista tuberculi minoris humeri (fundus sulci intertubercularis)', artery: 'A. thoracodorsalis'},
  trapezius: {origin: 'Linea nuchalis superior, protuberantia occipitalis externa, lig. nuchae, processus spinosi C7–T12', insertion: '1/3 lateralis claviculae, acromion, spina scapulae', artery: 'A. transversa cervicis (a. cervicalis superficialis), a. dorsalis scapulae'},
  'rhomboid-major': {origin: 'Processus spinosi T2–T5', insertion: 'Margo medialis scapulae (infra spinam)', artery: 'A. dorsalis scapulae'},
  'rhomboid-minor': {origin: 'Lig. nuchae, processus spinosi C7–T1', insertion: 'Margo medialis scapulae (ad radicem spinae)', artery: 'A. dorsalis scapulae'},
  'levator-scapulae': {origin: 'Tubercula posteriora processuum transversorum C1–C4', insertion: 'Angulus superior scapulae', artery: 'A. dorsalis scapulae, a. transversa cervicis'},
  'serratus-anterior': {origin: 'Facies externa costarum I–IX', insertion: 'Margo medialis scapulae (facies costalis), angulus inferior', artery: 'A. thoracica lateralis, a. thoracodorsalis'},
  'pectoralis-minor': {origin: 'Costae III–V', insertion: 'Processus coracoideus scapulae', artery: 'A. thoracoacromialis (rr. pectorales), a. thoracica lateralis'},
  subclavius: {origin: 'Costa I (junctura costochondralis)', insertion: 'Sulcus m. subclavii claviculae', artery: 'A. thoracoacromialis (r. clavicularis), a. suprascapularis'},
  supraspinatus: {origin: 'Fossa supraspinata scapulae', insertion: 'Tuberculum majus humeri (facies superior)', artery: 'A. suprascapularis'},
  infraspinatus: {origin: 'Fossa infraspinata scapulae', insertion: 'Tuberculum majus humeri (facies media)', artery: 'A. suprascapularis, a. circumflexa scapulae'},
  'teres-minor': {origin: 'Margo lateralis scapulae (2/3 superiores)', insertion: 'Tuberculum majus humeri (facies inferior)', artery: 'A. circumflexa scapulae, a. circumflexa humeri posterior'},
  'teres-major': {origin: 'Angulus inferior scapulae (facies posterior)', insertion: 'Crista tuberculi minoris humeri', artery: 'A. thoracodorsalis, a. circumflexa scapulae'},
  subscapularis: {origin: 'Fossa subscapularis', insertion: 'Tuberculum minus humeri', artery: 'A. subscapularis'},
  // Arm
  'biceps-brachii': {origin: 'Caput longum: tuberculum supraglenoidale; caput breve: apex processus coracoidei', insertion: 'Tuberositas radii, aponeurosis m. bicipitis brachii', artery: 'A. brachialis (rr. musculares)'},
  brachialis: {origin: 'Facies anterior humeri (1/2 distalis)', insertion: 'Tuberositas ulnae, processus coronoideus', artery: 'A. brachialis, a. recurrens radialis'},
  'triceps-brachii': {origin: 'Caput longum: tuberculum infraglenoidale; caput laterale: facies posterior humeri supra sulcum n. radialis; caput mediale: infra sulcum n. radialis', insertion: 'Olecranon ulnae', artery: 'A. profunda brachii, a. collateralis ulnaris superior'},
  anconeus: {origin: 'Epicondylus lateralis humeri', insertion: 'Olecranon, facies posterior ulnae (pars proximalis)', artery: 'A. collateralis media, a. interossea recurrens'},
  coracobrachialis: {origin: 'Apex processus coracoidei', insertion: 'Facies anteromedialis humeri (pars media)', artery: 'A. brachialis (rr. musculares)'},
  // Forearm, anterior
  'pronator-teres': {origin: 'Caput humerale: epicondylus medialis humeri; caput ulnare: processus coronoideus ulnae', insertion: 'Facies lateralis radii (pars media)', artery: 'A. ulnaris (a. recurrens ulnaris), a. radialis'},
  'flexor-carpi-radialis': {origin: 'Epicondylus medialis humeri', insertion: 'Basis ossis metacarpi II (et III)', artery: 'A. radialis'},
  'flexor-carpi-ulnaris': {origin: 'Caput humerale: epicondylus medialis; caput ulnare: olecranon, margo posterior ulnae', insertion: 'Os pisiforme, hamulus ossis hamati, basis ossis metacarpi V', artery: 'A. ulnaris'},
  'palmaris-longus': {origin: 'Epicondylus medialis humeri', insertion: 'Aponeurosis palmaris, retinaculum musculorum flexorum', artery: 'A. ulnaris'},
  'flexor-digitorum-superficialis': {origin: 'Caput humeroulnare: epicondylus medialis, processus coronoideus; caput radiale: facies anterior radii', insertion: 'Corpora phalangum mediarum II–V', artery: 'A. ulnaris, a. radialis'},
  'flexor-digitorum-profundus': {origin: 'Facies anterior et medialis ulnae, membrana interossea', insertion: 'Bases phalangum distalium II–V', artery: 'A. ulnaris, a. interossea anterior'},
  'flexor-pollicis-longus': {origin: 'Facies anterior radii, membrana interossea', insertion: 'Basis phalangis distalis pollicis', artery: 'A. interossea anterior'},
  // Forearm, posterior
  brachioradialis: {origin: 'Crista supraepicondylaris lateralis humeri', insertion: 'Processus styloideus radii (basis)', artery: 'A. recurrens radialis'},
  supinator: {origin: 'Epicondylus lateralis humeri, crista m. supinatoris ulnae, lig. collaterale radiale, lig. anulare radii', insertion: 'Facies lateralis radii (1/3 proximalis)', artery: 'A. recurrens radialis, a. interossea recurrens'},
  'extensor-carpi-radialis-longus': {origin: 'Crista supraepicondylaris lateralis humeri', insertion: 'Basis ossis metacarpi II (dorsum)', artery: 'A. collateralis radialis, a. recurrens radialis'},
  'extensor-carpi-radialis-brevis': {origin: 'Epicondylus lateralis humeri', insertion: 'Basis ossis metacarpi III (dorsum)', artery: 'A. recurrens radialis, a. radialis'},
  'extensor-carpi-ulnaris': {origin: 'Epicondylus lateralis humeri, margo posterior ulnae', insertion: 'Basis ossis metacarpi V', artery: 'A. interossea posterior'},
  'extensor-digitorum': {origin: 'Epicondylus lateralis humeri', insertion: 'Aponeuroses dorsales digitorum II–V', artery: 'A. interossea posterior'},
  'extensor-digiti-minimi': {origin: 'Epicondylus lateralis humeri', insertion: 'Aponeurosis dorsalis digiti minimi', artery: 'A. interossea posterior'},
  'extensor-pollicis-longus': {origin: 'Facies posterior ulnae (1/3 media), membrana interossea', insertion: 'Basis phalangis distalis pollicis', artery: 'A. interossea posterior'},
  'extensor-pollicis-brevis': {origin: 'Facies posterior radii, membrana interossea', insertion: 'Basis phalangis proximalis pollicis', artery: 'A. interossea posterior'},
  'abductor-pollicis-longus': {origin: 'Facies posteriores radii et ulnae, membrana interossea', insertion: 'Basis ossis metacarpi I', artery: 'A. interossea posterior'},
  // Hand
  thenar: {origin: 'Retinaculum musculorum flexorum, tubercula ossis scaphoidei et ossis trapezii', insertion: 'Os metacarpi I, basis phalangis proximalis pollicis', artery: 'R. palmaris superficialis a. radialis'},
  hypothenar: {origin: 'Os pisiforme, hamulus ossis hamati, retinaculum musculorum flexorum', insertion: 'Os metacarpi V, basis phalangis proximalis digiti minimi', artery: 'R. palmaris profundus a. ulnaris'},
  // Head and neck
  sternocleidomastoid: {origin: 'Caput sternale: manubrium sterni; caput claviculare: 1/3 medialis claviculae', insertion: 'Processus mastoideus, linea nuchalis superior', artery: 'A. occipitalis, a. thyroidea superior, a. suprascapularis'},
  masseter: {origin: 'Arcus zygomaticus', insertion: 'Tuberositas masseterica mandibulae (ramus, angulus)', artery: 'A. masseterica (a. maxillaris), a. facialis'},
  temporalis: {origin: 'Fossa temporalis, fascia temporalis', insertion: 'Processus coronoideus mandibulae', artery: 'Aa. temporales profundae (a. maxillaris), a. temporalis media'},
  digastric: {origin: 'Venter posterior: incisura mastoidea; venter anterior: fossa digastrica mandibulae', insertion: 'Tendo intermedius ad corpus et cornu majus ossis hyoidei', artery: 'A. submentalis, a. occipitalis, a. auricularis posterior'},
  mylohyoid: {origin: 'Linea mylohyoidea mandibulae', insertion: 'Raphe mylohyoidea, corpus ossis hyoidei', artery: 'A. submentalis, a. sublingualis'},
  geniohyoid: {origin: 'Spina mentalis inferior', insertion: 'Corpus ossis hyoidei', artery: 'A. sublingualis'},
  stylohyoid: {origin: 'Processus styloideus ossis temporalis', insertion: 'Corpus ossis hyoidei (ad cornu majus)', artery: 'A. facialis, a. occipitalis'},
  sternohyoid: {origin: 'Manubrium sterni, extremitas sternalis claviculae', insertion: 'Corpus ossis hyoidei', artery: 'A. thyroidea superior'},
  sternothyroid: {origin: 'Facies posterior manubrii sterni', insertion: 'Linea obliqua cartilaginis thyroideae', artery: 'A. thyroidea superior'},
  thyrohyoid: {origin: 'Linea obliqua cartilaginis thyroideae', insertion: 'Corpus et cornu majus ossis hyoidei', artery: 'A. thyroidea superior'},
  omohyoid: {origin: 'Venter inferior: margo superior scapulae (prope incisuram)', insertion: 'Venter superior: corpus ossis hyoidei', artery: 'A. thyroidea superior, a. transversa cervicis'},
  platysma: {origin: 'Fascia regionum pectoralis et deltoideae', insertion: 'Margo inferior mandibulae, cutis faciei inferioris, angulus oris', artery: 'A. submentalis, a. suprascapularis'},
  stylopharyngeus: {origin: 'Processus styloideus (facies medialis)', insertion: 'Paries pharyngis, margo posterior cartilaginis thyroideae', artery: 'A. pharyngea ascendens'},
  'constrictor-pharynx': {origin: 'Hamulus pterygoideus, raphe pterygomandibularis, os hyoideum, cartilagines thyroidea et cricoidea', insertion: 'Raphe pharyngis, tuberculum pharyngeum', artery: 'A. pharyngea ascendens, aa. thyroideae superior et inferior'},
  'levator-veli-palatini': {origin: 'Pars petrosa ossis temporalis, cartilago tubae auditivae', insertion: 'Aponeurosis palatina', artery: 'A. palatina ascendens, a. palatina descendens'},
  'tensor-veli-palatini': {origin: 'Fossa scaphoidea, spina ossis sphenoidalis, cartilago tubae auditivae', insertion: 'Aponeurosis palatina (circum hamulum pterygoideum)', artery: 'A. palatina ascendens, a. palatina descendens'},
  genioglossus: {origin: 'Spina mentalis superior', insertion: 'Dorsum linguae, corpus ossis hyoidei', artery: 'A. lingualis (a. profunda linguae, a. sublingualis)'},
  hyoglossus: {origin: 'Corpus et cornu majus ossis hyoidei', insertion: 'Margo lateralis linguae', artery: 'A. lingualis'},
  'orbicularis-oculi': {origin: 'Crista lacrimalis anterior, pars nasalis ossis frontalis, lig. palpebrale mediale', insertion: 'Cutis palpebrarum, raphe palpebralis lateralis', artery: 'A. facialis, a. temporalis superficialis, a. supraorbitalis'},
  buccinator: {origin: 'Processus alveolares maxillae et mandibulae (regio molarium), raphe pterygomandibularis', insertion: 'Angulus oris (m. orbicularis oris)', artery: 'A. buccalis (a. maxillaris), a. facialis'},
  extraocular: {origin: 'Anulus tendineus communis (mm. recti, m. obliquus superior); m. obliquus inferior: facies orbitalis maxillae', insertion: 'Sclera bulbi oculi', artery: 'A. ophthalmica (rr. musculares)'},
  // Trunk
  'rectus-abdominis': {origin: 'Crista pubica, symphysis pubica', insertion: 'Cartilagines costales V–VII, processus xiphoideus', artery: 'A. epigastrica superior, a. epigastrica inferior'},
  'external-oblique': {origin: 'Facies externa costarum V–XII', insertion: 'Linea alba, tuberculum pubicum, labium externum cristae iliacae', artery: 'Aa. intercostales posteriores inferiores, a. subcostalis, a. circumflexa ilium profunda'},
  'internal-oblique': {origin: 'Fascia thoracolumbalis, linea intermedia cristae iliacae, lig. inguinale (2/3 lateralis)', insertion: 'Costae X–XII, linea alba, pecten ossis pubis (falx inguinalis)', artery: 'Aa. intercostales posteriores, aa. epigastricae superior et inferior, a. circumflexa ilium profunda'},
  'transversus-abdominis': {origin: 'Cartilagines costales VII–XII, fascia thoracolumbalis, crista iliaca, lig. inguinale', insertion: 'Linea alba, crista pubica (falx inguinalis)', artery: 'Aa. intercostales posteriores, aa. lumbales, a. circumflexa ilium profunda'},
  'erector-spinae': {origin: 'Os sacrum, crista iliaca, processus spinosi lumbales (aponeurosis communis)', insertion: 'Costae, processus transversi et spinosi vertebrarum, processus mastoideus', artery: 'Rr. dorsales aa. intercostalium posteriorum et aa. lumbalium'},
  multifidus: {origin: 'Os sacrum, processus mammillares L1–L5, processus transversi T1–T12, processus articulares C4–C7', insertion: 'Processus spinosi vertebrarum 2–4 segmentis superiorum', artery: 'Rr. dorsales aa. intercostalium posteriorum et aa. lumbalium'},
  diaphragm: {origin: 'Pars sternalis: processus xiphoideus; pars costalis: cartilagines costales VII–XII; pars lumbalis: crura (L1–L3), ligg. arcuata', insertion: 'Centrum tendineum', artery: 'Aa. phrenicae superiores et inferiores, a. musculophrenica, a. pericardiacophrenica'},
  intercostal: {origin: 'Margo inferior costae superioris', insertion: 'Margo superior costae inferioris', artery: 'Aa. intercostales posteriores et anteriores'},
  'scalenus-anterior': {origin: 'Tubercula anteriora processuum transversorum C3–C6', insertion: 'Tuberculum m. scaleni anterioris costae I', artery: 'A. cervicalis ascendens (a. thyroidea inferior)'},
  // Hip
  'gluteus-maximus': {origin: 'Facies glutea ossis ilii (post lineam glutealem posteriorem), facies dorsalis ossis sacri et coccygis, lig. sacrotuberale', insertion: 'Tractus iliotibialis, tuberositas glutea femoris', artery: 'A. glutea inferior, a. glutea superior'},
  'gluteus-medius': {origin: 'Facies glutea ossis ilii (inter lineas gluteales anteriorem et posteriorem)', insertion: 'Facies lateralis trochanteris majoris', artery: 'A. glutea superior'},
  'gluteus-minimus': {origin: 'Facies glutea ossis ilii (inter lineas gluteales anteriorem et inferiorem)', insertion: 'Facies anterior trochanteris majoris', artery: 'A. glutea superior'},
  piriformis: {origin: 'Facies pelvica ossis sacri (S2–S4)', insertion: 'Apex trochanteris majoris', artery: 'A. glutea superior, a. glutea inferior'},
  iliacus: {origin: 'Fossa iliaca', insertion: 'Trochanter minor femoris (cum m. psoas major)', artery: 'A. iliolumbalis (r. iliacus), a. circumflexa ilium profunda'},
  'psoas-major': {origin: 'Corpora et processus transversi T12–L4, disci intervertebrales', insertion: 'Trochanter minor femoris', artery: 'Aa. lumbales, a. iliolumbalis'},
  'quadratus-femoris': {origin: 'Margo lateralis tuberis ischiadici', insertion: 'Tuberculum quadratum (crista intertrochanterica)', artery: 'A. circumflexa femoris medialis'},
  'obturator-internus': {origin: 'Facies interna membranae obturatoriae et margines foraminis obturati', insertion: 'Facies medialis trochanteris majoris (fossa trochanterica)', artery: 'A. obturatoria, a. pudenda interna'},
  // Thigh
  sartorius: {origin: 'Spina iliaca anterior superior', insertion: 'Facies medialis tibiae (pes anserinus superficialis)', artery: 'A. femoralis (rr. musculares), a. descendens genus'},
  'rectus-femoris': {origin: 'Spina iliaca anterior inferior, margo superior acetabuli', insertion: 'Basis patellae; per lig. patellae ad tuberositatem tibiae', artery: 'A. circumflexa femoris lateralis (r. descendens)'},
  'vastus-lateralis': {origin: 'Trochanter major, labium laterale lineae asperae', insertion: 'Margo lateralis patellae; per lig. patellae ad tuberositatem tibiae', artery: 'A. circumflexa femoris lateralis'},
  'vastus-medialis': {origin: 'Linea intertrochanterica, labium mediale lineae asperae', insertion: 'Margo medialis patellae; per lig. patellae ad tuberositatem tibiae', artery: 'A. femoralis, a. profunda femoris'},
  'vastus-intermedius': {origin: 'Facies anterior et lateralis corporis femoris', insertion: 'Basis patellae; per lig. patellae ad tuberositatem tibiae', artery: 'A. circumflexa femoris lateralis, a. profunda femoris'},
  'adductor-longus': {origin: 'Corpus ossis pubis (infra tuberculum pubicum)', insertion: 'Labium mediale lineae asperae (1/3 media)', artery: 'A. profunda femoris, a. obturatoria'},
  'adductor-magnus': {origin: 'Ramus inferior ossis pubis, ramus ossis ischii, tuber ischiadicum', insertion: 'Linea aspera, tuberculum adductorium femoris', artery: 'A. profunda femoris (aa. perforantes), a. obturatoria, a. femoralis'},
  gracilis: {origin: 'Corpus et ramus inferior ossis pubis', insertion: 'Facies medialis tibiae (pes anserinus superficialis)', artery: 'A. profunda femoris, a. obturatoria'},
  'biceps-femoris': {origin: 'Caput longum: tuber ischiadicum; caput breve: labium laterale lineae asperae', insertion: 'Caput fibulae', artery: 'Aa. perforantes (a. profunda femoris), a. glutea inferior'},
  semitendinosus: {origin: 'Tuber ischiadicum', insertion: 'Facies medialis tibiae (pes anserinus superficialis)', artery: 'Aa. perforantes (a. profunda femoris), a. glutea inferior'},
  semimembranosus: {origin: 'Tuber ischiadicum', insertion: 'Facies posterior condyli medialis tibiae', artery: 'Aa. perforantes (a. profunda femoris), a. poplitea'},
  // Leg
  'tibialis-anterior': {origin: 'Condylus lateralis et facies lateralis tibiae, membrana interossea', insertion: 'Os cuneiforme mediale, basis ossis metatarsi I', artery: 'A. tibialis anterior'},
  'extensor-hallucis-longus': {origin: 'Facies medialis fibulae (pars media), membrana interossea', insertion: 'Basis phalangis distalis hallucis', artery: 'A. tibialis anterior'},
  'extensor-digitorum-longus': {origin: 'Condylus lateralis tibiae, facies medialis fibulae, membrana interossea', insertion: 'Aponeuroses dorsales digitorum II–V', artery: 'A. tibialis anterior'},
  'fibularis-longus': {origin: 'Caput et facies lateralis fibulae (2/3 superiores)', insertion: 'Os cuneiforme mediale, basis ossis metatarsi I (facies plantaris)', artery: 'A. fibularis, a. tibialis anterior'},
  gastrocnemius: {origin: 'Caput mediale: supra condylum medialem femoris; caput laterale: condylus lateralis femoris', insertion: 'Tuber calcanei (tendo calcaneus)', artery: 'Aa. surales (a. poplitea)'},
  soleus: {origin: 'Caput et facies posterior fibulae, linea m. solei tibiae, arcus tendineus m. solei', insertion: 'Tuber calcanei (tendo calcaneus)', artery: 'A. tibialis posterior, a. fibularis, aa. surales'},
  'tibialis-posterior': {origin: 'Membrana interossea, facies posteriores tibiae et fibulae', insertion: 'Tuberositas ossis navicularis, ossa cuneiformia, bases ossium metatarsi II–IV', artery: 'A. tibialis posterior, a. fibularis'},
  'flexor-hallucis-longus': {origin: 'Facies posterior fibulae (2/3 inferiores), membrana interossea', insertion: 'Basis phalangis distalis hallucis', artery: 'A. fibularis, a. tibialis posterior'},
  'flexor-digitorum-longus': {origin: 'Facies posterior tibiae (infra lineam m. solei)', insertion: 'Bases phalangum distalium II–V', artery: 'A. tibialis posterior'},
  popliteus: {origin: 'Facies lateralis condyli lateralis femoris, meniscus lateralis', insertion: 'Facies posterior tibiae (supra lineam m. solei)', artery: 'Aa. inferiores medialis et lateralis genus (a. poplitea)'},
};

/** The attachment lines for a structure fact, or null for facts that are not muscles. */
export function muscleAttachments(factId: string): MuscleAttachments | null {
  return A[factId] ?? null;
}
