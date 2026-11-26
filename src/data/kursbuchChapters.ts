export interface KursbuchChapter {
  chapterId: string;
  module: string;
  title: string;
  pages: string;
  questionIds: string[];
}

export const KURSBUCH_CHAPTERS: KursbuchChapter[] = [
  {
    chapterId: '1.1',
    module: 'Modul I: Politik in der Demokratie',
    title: 'Grundrechte im Grundgesetz',
    pages: 'S. 14–21',
    questionIds: [
      '001', '004', '006', '007', '008', '009', '010', '011', '012', '014',
      '015', '016', '017', '018', '019', '262', '274', '277', '278', '281', '289',
    ],
  },
  {
    chapterId: '1.2',
    module: 'Modul I: Politik in der Demokratie',
    title: 'Staatssymbole und Verfassungsprinzipien',
    pages: 'S. 22–29',
    questionIds: [
      '003', '020', '021', '022', '023', '024', '025', '026', '027', '029',
      '030', '032', '034', '035', '036', '038', '040', '043', '045', '049',
      '050', '051', '052', '053', '054', '061', '063', '064', '067', '069',
      '080', '097', '099', '100', '101', '102', '104', '135', '136', '137',
      '138', '143', '144', '145', '148', '171', '222', '223', '225', '227',
      '229', '233', '247', '263', '285', '286', '287',
    ],
  },
  {
    chapterId: '1.3',
    module: 'Modul I: Politik in der Demokratie',
    title: 'Aufgaben des Staates und Pflichten der Bürger',
    pages: 'S. 30–35',
    questionIds: [
      '046', '047', '056', '068', '077', '095', '131', '139', '140', '141',
      '142', '146', '147', '150', '241', '246', '253', '256', '265', '268',
      '276', '280', '283', '290',
    ],
  },
  {
    chapterId: '1.4',
    module: 'Modul I: Politik in der Demokratie',
    title: 'Verfassungsorgane und Parteien',
    pages: 'S. 36–43',
    questionIds: [
      '013', '028', '031', '037', '039', '041', '042', '044', '048', '055',
      '057', '058', '060', '062', '065', '070', '071', '072', '073', '074',
      '075', '076', '078', '079', '081', '082', '083', '084', '085', '086',
      '087', '088', '089', '090', '091', '092', '098', '103', '107', '109',
      '110', '124', '125', '128', '129', '216',
    ],
  },
  {
    chapterId: '1.5',
    module: 'Modul I: Politik in der Demokratie',
    title: 'Gesellschaftliche Teilhabe und politische Beteiligung',
    pages: 'S. 44–49',
    questionIds: [
      '005', '093', '094', '105', '106', '108', '112', '113', '114', '115',
      '116', '117', '119', '120', '121', '122', '123', '126', '127', '130',
      '132', '133', '134', '243', '282',
    ],
  },
  {
    chapterId: '2.1',
    module: 'Modul II: Geschichte und Verantwortung',
    title: 'Der Nationalsozialismus und seine Folgen',
    pages: 'S. 52–57',
    questionIds: [
      '096', '111', '149', '152', '153', '154', '155', '156', '157', '158',
      '159', '160', '161', '162', '163', '164', '167', '168', '170', '172',
      '175', '176', '177', '179', '184', '206', '220', '288',
    ],
  },
  {
    chapterId: '2.2',
    module: 'Modul II: Geschichte und Verantwortung',
    title: 'Deutsche Geschichte von der Teilung bis zur Wiedervereinigung',
    pages: 'S. 58–63',
    questionIds: [
      '151', '165', '166', '169', '174', '178', '180', '181', '183', '185',
      '186', '187', '188', '189', '190', '191', '192', '193', '194', '195',
      '196', '197', '198', '199', '200', '201', '202', '203', '204', '205',
      '207', '208', '209', '210', '211', '212', '213', '214', '215', '217',
      '218', '219', '228', '297', '298', '299', '300',
    ],
  },
  {
    chapterId: '2.3',
    module: 'Modul II: Geschichte und Verantwortung',
    title: 'Europäische Integration',
    pages: 'S. 64–69',
    questionIds: [
      '173', '221', '224', '226', '230', '231', '232', '234', '235', '236',
      '237', '238', '239', '240',
    ],
  },
  {
    chapterId: '3.1',
    module: 'Modul III: Mensch und Gesellschaft',
    title: 'Familie, Zusammenleben & Rollenverständnis',
    pages: 'S. 72–79',
    questionIds: ['242', '245', '252', '254', '267', '269', '272', '275'],
  },
  {
    chapterId: '3.2',
    module: 'Modul III: Mensch und Gesellschaft',
    title: 'Erziehung und Bildung',
    pages: 'S. 80–87',
    questionIds: [
      '244', '248', '249', '250', '251', '255', '257', '258', '259', '260',
      '261', '270', '273', '284',
    ],
  },
  {
    chapterId: '3.3',
    module: 'Modul III: Mensch und Gesellschaft',
    title: 'Toleranz und Zusammenleben',
    pages: 'S. 88–97',
    questionIds: ['264', '266', '279'],
  },
  {
    chapterId: '3.4',
    module: 'Modul III: Mensch und Gesellschaft',
    title: 'Religiöse Vielfalt',
    pages: 'S. 98–103',
    questionIds: [
      '002', '033', '059', '066', '118', '182', '271', '291', '292', '293',
      '294', '295', '296',
    ],
  },
];

export const KURSBUCH_MODULES: string[] = Array.from(
  new Set(KURSBUCH_CHAPTERS.map((c) => c.module))
);

export const KURSBUCH_CHAPTER_BY_ID: Record<string, KursbuchChapter> =
  KURSBUCH_CHAPTERS.reduce((acc, ch) => {
    acc[ch.chapterId] = ch;
    return acc;
  }, {} as Record<string, KursbuchChapter>);
