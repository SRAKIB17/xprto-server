CREATE TABLE
  `chat_rooms` (
    `room_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `room_name` varchar(255) DEFAULT NULL,
    `is_group` tinyint (1) DEFAULT '0',
    `is_announcement` BOOLEAN DEFAULT FALSE,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    `thumbnail` varchar(500) DEFAULT NULL
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
  `chat_room_memberships` (
    `chat_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` bigint UNSIGNED NOT NULL,
    `user_role` ENUM ('system', 'admin', 'gym', 'trainer', 'client') NOT NULL DEFAULT 'system',
    `room_id` bigint UNSIGNED NOT NULL,
    join_date timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`chat_id`),
    UNIQUE (`user_id`, `room_id`, `user_role`),
    FOREIGN KEY (`room_id`) REFERENCES `chat_rooms` (`room_id`) ON DELETE CASCADE
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
  `chat_messages` (
    attachments JSON DEFAULT NULL,
    `message_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` bigint UNSIGNED NOT NULL,
    `sender_role` ENUM ('s', 'a', 'g', 't', 'c') DEFAULT "c",
    `room_id` bigint UNSIGNED NOT NULL,
    `message_type` enum ('TEXT', 'FILE') DEFAULT 'TEXT',
    `text` text DEFAULT NULL,
    `is_read` BOOLEAN DEFAULT FALSE,
    -- `is_update` tinyint (1) DEFAULT '0',
    -- `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    `timestamp` timestamp DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`room_id`) REFERENCES `chat_rooms` (`room_id`) ON DELETE CASCADE
  ) ENGINE = InnoDB AUTO_INCREMENT = 220 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- CREATE TABLE
--   `message_attachments` (
--     `attachment_id` bigint NOT NULL AUTO_INCREMENT,
--     `message_id` bigint NOT NULL,
--     `file_url` varchar(255) NOT NULL,
--     `file_name` varchar(100) DEFAULT NULL,
--     `file_size` bigint DEFAULT NULL,
--     `file_type` varchar(50) DEFAULT NULL,
--     `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
--     `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
--     PRIMARY KEY (`attachment_id`),
--     KEY `message_id` (`message_id`),
--     CONSTRAINT `message_attachments_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `messages` (`message_id`) ON DELETE CASCADE
--   ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- CREATE TABLE
--   `message_reads` (
--     `read_id` bigint NOT NULL AUTO_INCREMENT,
--     `message_id` bigint NOT NULL,
--     `user_id` bigint NOT NULL,
--     `is_read` tinyint (1) DEFAULT '0',
--     `read_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
--     PRIMARY KEY (`read_id`),
--     KEY `message_id` (`message_id`),
--     KEY `user_id` (`user_id`),
--     CONSTRAINT `message_reads_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `messages` (`message_id`) ON DELETE CASCADE,
--     CONSTRAINT `message_reads_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
--   ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
--
-- Dumping data for table `message_reads`
--
--
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--
LOCK TABLES `messages` WRITE;

/*!40000 ALTER TABLE `messages` DISABLE KEYS */;

INSERT INTO
  `messages`
VALUES
  (
    1,
    261,
    1731545186908,
    'TEXT',
    'sfsdf',
    0,
    NULL,
    '2024-11-15 14:50:00'
  ),
  (
    2,
    5,
    1731545186908,
    'TEXT',
    'sfsf',
    0,
    NULL,
    '2024-11-15 14:50:05'
  ),
  (
    3,
    5,
    1731545186908,
    'TEXT',
    'fsdf',
    0,
    NULL,
    '2024-11-15 14:50:28'
  ),
  (
    4,
    3,
    1731545186908,
    'TEXT',
    'fsfd',
    0,
    NULL,
    '2024-11-15 14:53:13'
  ),
  (
    5,
    261,
    1731545186908,
    'TEXT',
    'fsdf',
    0,
    NULL,
    '2024-11-15 14:54:57'
  ),
  (
    6,
    261,
    1731545186908,
    'TEXT',
    'fsdfd',
    0,
    NULL,
    '2024-11-15 14:55:40'
  ),
  (
    7,
    261,
    1731545186908,
    'TEXT',
    'fsdff',
    0,
    NULL,
    '2024-11-15 14:55:49'
  ),
  (
    8,
    261,
    1731545186908,
    'TEXT',
    'fsdf',
    0,
    NULL,
    '2024-11-15 14:56:12'
  ),
  (
    9,
    261,
    1731545186908,
    'TEXT',
    NULL,
    0,
    NULL,
    '2024-11-15 15:03:43'
  ),
  (
    10,
    3,
    1731545186908,
    'TEXT',
    NULL,
    0,
    NULL,
    '2024-11-15 15:03:55'
  ),
  (
    11,
    3,
    1731545186908,
    'TEXT',
    NULL,
    0,
    NULL,
    '2024-11-15 15:04:37'
  ),
  (
    12,
    3,
    1731545186908,
    'TEXT',
    NULL,
    0,
    NULL,
    '2024-11-15 15:04:43'
  ),
  (
    13,
    5,
    1731545186908,
    'TEXT',
    'sdfsdfsfsfsdfsf',
    0,
    NULL,
    '2024-11-15 15:11:01'
  ),
  (
    14,
    3,
    1731545186908,
    'TEXT',
    'fsfffs',
    0,
    NULL,
    '2024-11-15 15:11:45'
  ),
  (
    15,
    261,
    1731545186908,
    'TEXT',
    'gfdfdfdsfdsfsdf',
    0,
    NULL,
    '2024-11-15 15:39:12'
  ),
  (
    16,
    3,
    1731545186908,
    'TEXT',
    'fsdfsdfsdfsd',
    0,
    NULL,
    '2024-11-15 15:39:53'
  ),
  (
    17,
    3,
    1731545186908,
    'TEXT',
    'fdfd',
    0,
    NULL,
    '2024-11-15 15:41:58'
  ),
  (
    18,
    3,
    1731545186908,
    'TEXT',
    'fsdfsdffsdfsdf',
    0,
    NULL,
    '2024-11-15 16:39:11'
  ),
  (
    19,
    261,
    1731545186908,
    'TEXT',
    'fsdf',
    0,
    NULL,
    '2024-11-15 16:39:32'
  ),
  (
    20,
    261,
    1731545186908,
    'TEXT',
    'fsdf',
    0,
    NULL,
    '2024-11-15 16:39:59'
  ),
  (
    21,
    261,
    1731545186908,
    'TEXT',
    'fsdf',
    0,
    NULL,
    '2024-11-15 16:40:10'
  ),
  (
    22,
    261,
    1731545186908,
    'TEXT',
    'fsd',
    0,
    NULL,
    '2024-11-15 16:40:28'
  ),
  (
    23,
    5,
    1731545186908,
    'TEXT',
    'fsdf',
    0,
    NULL,
    '2024-11-15 17:15:03'
  ),
  (
    24,
    3,
    1731545186908,
    'TEXT',
    'x.com',
    0,
    NULL,
    '2024-11-15 17:20:27'
  ),
  (
    25,
    261,
    1731545186908,
    'TEXT',
    'hello guys',
    0,
    NULL,
    '2024-11-15 17:20:41'
  ),
  (
    26,
    261,
    1731545186908,
    'TEXT',
    'okdy done',
    0,
    NULL,
    '2024-11-15 17:20:44'
  ),
  (
    27,
    261,
    1731545186908,
    'TEXT',
    'everything okey?',
    0,
    NULL,
    '2024-11-15 17:20:49'
  ),
  (
    28,
    261,
    1731545186908,
    'TEXT',
    'yes',
    0,
    NULL,
    '2024-11-15 17:20:51'
  ),
  (
    29,
    5,
    1731545186908,
    'TEXT',
    'wos',
    0,
    NULL,
    '2024-11-15 17:20:55'
  ),
  (
    30,
    261,
    1731545186908,
    'TEXT',
    'yo yo',
    0,
    NULL,
    '2024-11-15 18:21:48'
  ),
  (
    31,
    5,
    1731545186908,
    'TEXT',
    'fsdf',
    0,
    NULL,
    '2024-11-15 18:21:57'
  ),
  (
    32,
    3,
    1731545186908,
    'TEXT',
    'x.com',
    0,
    NULL,
    '2024-11-15 18:22:07'
  ),
  (
    33,
    261,
    1731545186908,
    'TEXT',
    'sfsdf',
    0,
    NULL,
    '2024-11-15 18:32:18'
  ),
  (
    34,
    261,
    1731545186908,
    'TEXT',
    'Sample PDF Document https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf https://drive.google.com/file/d/1t-Rj09fpVwZdLvKb5vHfGVnMYYI7Sm1t/view?usp=sharing Purple Pi Avatar https://www.kasandbox.org/programming-images/avatars/purple-pi.png Marcimus Avatar https://www.kasandbox.org/programming-images/avatars/marcimus.png Sample YouTube Video https://www.youtube.com/watch?v=dQw4w9WgXcQ Pexels Stock Video https://videos.pexels.com/video-files/855737/855737-hd_1920_1080_30fps.mp4  Freesound Sample Audio https://www.w3schools.com/html/horse.mp3',
    0,
    NULL,
    '2024-11-16 09:12:16'
  ),
  (
    35,
    261,
    1731545186908,
    'TEXT',
    'Check out this cool image! https://example.com/image.mp4 https://example.com/image.jpg https://example.com',
    0,
    NULL,
    '2024-11-16 10:32:17'
  ),
  (
    36,
    261,
    1731545186908,
    'TEXT',
    'Check out this cool image! https://example.com/image.mp4 https://example.com/image.jpg https://example.com/text.pdf',
    0,
    NULL,
    '2024-11-16 10:35:26'
  ),
  (
    37,
    261,
    1731545186908,
    'TEXT',
    'Check out this cool image! https://example.com/image.mp4 https://example.com/image.jpg https://example.com',
    0,
    NULL,
    '2024-11-16 10:35:54'
  ),
  (
    38,
    5,
    1731545186908,
    'TEXT',
    '[   { \"url\": \"https://example.com/sample.mp4\", \"type\": \"video\" },   { \"url\": \"https://example.com/image.jpg\", \"type\": \"image\" },   { \"url\": \"https://example.com/audio.mp3\", \"type\": \"audio\" },   { \"url\": \"https://example.com/document.pdf\", \"type\": \"document\" } ]',
    0,
    NULL,
    '2024-11-16 10:40:42'
  ),
  (
    39,
    5,
    1731545186908,
    'TEXT',
    '\'https://example.com/sample.pdf\', // PDF file     \'https://example.com/document.docx\', // Word document     \'https://example.com/spreadsheet.xlsx\', // Excel file     \'https://example.com/presentation.pptx\', // PowerPoint file     \'https://example.com/otherfile.txt\' // Other document',
    0,
    NULL,
    '2024-11-16 10:47:04'
  ),
  (
    40,
    3,
    1731545186908,
    'TEXT',
    '\'https://example.com/sample.pdf\', // PDF file     \'https://example.com/document.docx\', // Word document     \'https://example.com/spreadsheet.xlsx\', // Excel file     \'https://example.com/presentation.pptx\', // PowerPoint file     \'https://example.com/otherfile.txt\' // Other document',
    0,
    NULL,
    '2024-11-16 10:48:03'
  ),
  (
    41,
    3,
    1731545222919,
    'TEXT',
    'fsdf',
    0,
    NULL,
    '2024-11-16 10:49:24'
  ),
  (
    42,
    3,
    1731545186908,
    'TEXT',
    'sfsdf',
    0,
    NULL,
    '2024-11-16 10:50:36'
  ),
  (
    43,
    3,
    1731545222919,
    'TEXT',
    'x.com',
    0,
    NULL,
    '2024-11-16 10:55:10'
  ),
  (
    44,
    3,
    1731545222919,
    'TEXT',
    'http://x.com',
    0,
    NULL,
    '2024-11-16 10:59:20'
  ),
  (
    45,
    3,
    1731545186908,
    'TEXT',
    'https://svg-pro.vercel.app/_next/static/media/accessibility.c9bbff63.svg',
    0,
    NULL,
    '2024-11-16 11:00:47'
  ),
  (
    46,
    3,
    1731545186908,
    'TEXT',
    'data:image/png;base64,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',
    0,
    NULL,
    '2024-11-16 11:02:18'
  ),
  (
    47,
    3,
    1731545186908,
    'TEXT',
    'https://img.freepik.com/free-photo/colorful-triangle-paper-pack-desk_23-2148547767.jpg?t=st=1731754963~exp=1731758563~hmac=067bce4e12c143a5805f132d982d41db3f70291e6bbf0b338d135f60c5be63b0&w=1060',
    0,
    NULL,
    '2024-11-16 11:03:00'
  ),
  (
    48,
    3,
    1731545186908,
    'TEXT',
    'https://img.freepik.com/free-photo/colorful-triangle-paper-pack-desk_23-2148547767.jpg',
    0,
    NULL,
    '2024-11-16 11:03:12'
  ),
  (
    49,
    3,
    1731545186908,
    'TEXT',
    'fsdf',
    0,
    NULL,
    '2024-11-16 11:03:33'
  ),
  (
    50,
    5,
    1731545186908,
    'TEXT',
    'https://img.freepik.com/free-photo/colorful-triangle-paper-pack-desk_23-2148547767.jpg',
    0,
    NULL,
    '2024-11-16 11:04:15'
  ),
  (
    51,
    5,
    1731545186908,
    'TEXT',
    'https://img.freepik.com/free-photo/colorful-triangle-paper-pack-desk_23-2148547767.jpg',
    0,
    NULL,
    '2024-11-16 11:04:32'
  ),
  (
    52,
    5,
    1731545222919,
    'TEXT',
    'https://img.freepik.com/free-photo/colorful-triangle-paper-pack-desk_23-2148547767.jpg',
    0,
    NULL,
    '2024-11-16 11:04:49'
  ),
  (
    53,
    3,
    1731545186908,
    'TEXT',
    'https://img.freepik.com/free-photo/colorful-triangle-paper-pack-desk_23-2148547767.jpg',
    0,
    NULL,
    '2024-11-16 11:05:06'
  ),
  (
    54,
    3,
    1731545222919,
    'TEXT',
    'xxxxxxxxx',
    0,
    NULL,
    '2024-11-16 11:05:21'
  ),
  (
    55,
    5,
    1731545222919,
    'TEXT',
    'xxxxxx',
    0,
    NULL,
    '2024-11-16 11:05:26'
  ),
  (
    56,
    5,
    1731545222919,
    'TEXT',
    '[   {     \"type\": \"pdf\",     \"url\": \"https://www.nist.gov/document/cybersecurity-framework-pdf\"   },   {     \"type\": \"pdf\",     \"url\": \"https://grants.nih.gov/grants/how-to-apply-application-guide/forms/family/form-f/pph-398.pdf\"   },   {     \"type\": \"doc\",     \"url\": \"https://www.niaid.nih.gov/sites/default/files/K99-R00-SampleApplication-2020.docx\"   },   {     \"type\": \"xlsx\",     \"url\": \"https://www.archives.gov/files/research/genealogy/charts-forms/natarch-pedigree-chart.xlsx\"   },   {     \"type\": \"xlsx\",     \"url\": \"https://www.cdc.gov/brfss/questionnaires/pdf-ques/2021-BRFSS-Questionnaire-ENG.xlsx\"   },   {     \"type\": \"mp4\",     \"url\": \"https://video.nationalgeographic.com/video/00000144-0a24-d3cb-a96c-7b2fe1450000\"   },   {     \"type\": \"mp4\",     \"url\": \"https://files.ncbi.nlm.nih.gov/video/sample_video.mp4\"   },   {     \"type\": \"mp3\",     \"url\": \"https://www.soundjay.com/button/beep-07.mp3\"   },   {     \"type\": \"audio\",     \"url\": \"https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav\"   },   {     \"type\": \"video\",     \"url\": \"https://www.sample-videos.com/video123/mp4/480/asdasd.mp4\"   },   {     \"type\": \"docx\",     \"url\": \"https://www.niaid.nih.gov/sites/default/files/sample-grant.docx\"   },   {     \"type\": \"ppt\",     \"url\": \"https://www.epa.gov/sites/default/files/2020-01/sample-presentation.ppt\"   },   {     \"type\": \"pptx\",     \"url\": \"https://www.nih.gov/sites/default/files/2021/presentation-sample.pptx\"   },   {     \"type\": \"pdf\",     \"url\": \"https://www.nist.gov/system/files/documents/2017/05/09/CloudComputing.pdf\"   },   {     \"type\": \"xlsx\",     \"url\": \"https://www.fda.gov/media/124638/download\"   },   {     \"type\": \"xls\",     \"url\": \"https://www.cdc.gov/diabetes/data/statistics-report/2020-national-diabetes-statistics-report.xlsx\"   },   {     \"type\": \"video\",     \"url\": \"https://download.samplelib.com/mp4/sample-5s.mp4\"   },   {     \"type\": \"pdf\",     \"url\": \"https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/855630/UK_Government_Digital_Service.pdf\"   },   {     \"type\": \"pdf\",     \"url\": \"https://www.unicef.org/sites/default/files/2020-04/COVID-19-parenting-tips.pdf\"   },   {     \"type\": \"image\",     \"url\": \"https://www.w3schools.com/w3css/img_lights.jpg\"   },   {     \"type\": \"image\",     \"url\": \"https://www.nasa.gov/sites/default/files/thumbnails/image/nasa-logo-web-rgb.png\"   },   {     \"type\": \"image\",     \"url\": \"https://images.unsplash.com/photo-1542089363-c3bd38516e4b\"   },   {     \"type\": \"image\",     \"url\": \"https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_big.jpg\"   },   {     \"type\": \"pdf\",     \"url\": \"https://www.irs.gov/pub/irs-pdf/fw4.pdf\"   },   {     \"type\": \"pdf\",     \"url\": \"https://www.oecd.org/finance/financial-markets/48742056.pdf\"   },   {     \"type\": \"docx\",     \"url\": \"https://www.openoffice.org/documentation/tutorials/PDFexport/sample-file.docx\"   },   {     \"type\": \"audio\",     \"url\": \"https://ia802508.us.archive.org/5/items/testmp3testfile/mpthreetest.mp3\"   },   {     \"type\": \"xls\",     \"url\": \"https://people.sc.fsu.edu/~jburkardt/data/csv/airtravel.csv\"   },   {     \"type\": \"audio\",     \"url\": \"https://sampleswap.org/samples-ghost/DRUMS%20(SINGLE%20HITS)/hi-hats/36[kb]909-hat-open.wav.mp3\"   },   {     \"type\": \"pdf\",     \"url\": \"https://www.who.int/docs/default-source/coronaviruse/who-china-joint-mission-on-covid-19-final-report.pdf\"   },   {     \"type\": \"video\",     \"url\": \"https://storage.googleapis.com/web-dev-assets/video-and-source/video.mp4\"   },   {     \"type\": \"pdf\",     \"url\": \"https://unesdoc.unesco.org/ark:/48223/pf0000233321\"   },   {     \"type\": \"image\",     \"url\": \"https://upload.wikimedia.org/wikipedia/commons/a/a3/Eiffel_Tower_Paris_July_2015.jpg\"   },   {     \"type\": \"audio\",     \"url\": \"https://ccrma.stanford.edu/~jos/mp3/sample.mp3\"   },   {     \"type\": \"audio\",     \"url\": \"https://file-examples.com/wp-content/uploads/2017/11/file_example_MP3_700KB.mp3\"   },   {     \"type\": \"xlsx\",     \"url\": \"https://github.com/SheetJS/sheetjs/raw/master/demos/sample.xlsx\"   },   {     \"type\": \"pdf\",     \"url\": \"https://dumps.wikimedia.org/other/static_html_dumps/current_en.wikipedia.org.tar.gz\"   },   {     \"type\": \"pdf\",     \"url\": \"https://arxiv.org/pdf/quant-ph/0410100.pdf\"   },   {     \"type\": \"audio\",     \"url\": \"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3\"   },   {     \"type\": \"pdf\",     \"url\": \"https://www.gov.uk/government/uploads/system/uploads/attachment_data/file/229154/01_how_to_write_a_paper.pdf\"   },   {     \"type\": \"doc\",     \"url\": \"https://calhoun.nps.edu/bitstream/handle/10945/39080/doc1.doc?sequence=1\"   },   {     \"type\": \"mp4\",     \"url\": \"https://filesamples.com/samples/video/mp4/sample_640x360.mp4\"   },   {     \"type\": \"video\",     \"url\": \"https://media.w3.org/2010/05/sintel/trailer_hd.mp4\"   },   {     \"type\": \"xls\",     \"url\": \"https://www.fao.org/tempref/docrep/fao/011/ai044e/ai044e00.xls\"   },   {     \"type\": \"ppt\",     \"url\": \"https://www.eff.org/document/case-study-powerpoint-presentation\"   },   {     \"type\": \"pdf\",     \"url\": \"https://openknowledge.worldbank.org/bitstream/handle/10986/35207/9781464814353.pdf\"   },   {     \"type\": \"docx\",     \"url\": \"https://sample-videos.com/doc/Sample-doc-file-for-testing.docx\"   } ]',
    0,
    NULL,
    '2024-11-16 11:07:01'
  ),
  (
    57,
    5,
    1731545186908,
    'TEXT',
    'https://www.nist.gov/document/cybersecurity-framework-pdf https://grants.nih.gov/grants/how-to-apply-application-guide/forms/family/form-f/pph-398.pdf https://www.niaid.nih.gov/sites/default/files/K99-R00-SampleApplication-2020.docx https://www.archives.gov/files/research/genealogy/charts-forms/natarch-pedigree-chart.xlsx https://www.cdc.gov/brfss/questionnaires/pdf-ques/2021-BRFSS-Questionnaire-ENG.xlsx https://video.nationalgeographic.com/video/00000144-0a24-d3cb-a96c-7b2fe1450000 https://files.ncbi.nlm.nih.gov/video/sample_video.mp4 https://www.soundjay.com/button/beep-07.mp3 https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav https://www.sample-videos.com/video123/mp4/480/asdasd.mp4 https://www.niaid.nih.gov/sites/default/files/sample-grant.docx https://www.epa.gov/sites/default/files/2020-01/sample-presentation.ppt https://www.nih.gov/sites/default/files/2021/presentation-sample.pptx https://www.nist.gov/system/files/documents/2017/05/09/CloudComputing.pdf https://www.fda.gov/media/124638/download https://www.cdc.gov/diabetes/data/statistics-report/2020-national-diabetes-statistics-report.xlsx https://download.samplelib.com/mp4/sample-5s.mp4 https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/855630/UK_Government_Digital_Service.pdf https://www.unicef.org/sites/default/files/2020-04/COVID-19-parenting-tips.pdf https://www.w3schools.com/w3css/img_lights.jpg https://www.nasa.gov/sites/default/files/thumbnails/image/nasa-logo-web-rgb.png https://images.unsplash.com/photo-1542089363-c3bd38516e4b https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_big.jpg https://www.irs.gov/pub/irs-pdf/fw4.pdf https://www.oecd.org/finance/financial-markets/48742056.pdf https://www.openoffice.org/documentation/tutorials/PDFexport/sample-file.docx https://ia802508.us.archive.org/5/items/testmp3testfile/mpthreetest.mp3 https://people.sc.fsu.edu/~jburkardt/data/csv/airtravel.csv https://sampleswap.org/samples-ghost/DRUMS%20(SINGLE%20HITS)/hi-hats/36[kb]909-hat-open.wav.mp3 https://www.who.int/docs/default-source/coronaviruse/who-china-joint-mission-on-covid-19-final-report.pdf https://storage.googleapis.com/web-dev-assets/video-and-source/video.mp4 https://unesdoc.unesco.org/ark:/48223/pf0000233321 https://upload.wikimedia.org/wikipedia/commons/a/a3/Eiffel_Tower_Paris_July_2015.jpg https://ccrma.stanford.edu/~jos/mp3/sample.mp3 https://file-examples.com/wp-content/uploads/2017/11/file_example_MP3_700KB.mp3 https://github.com/SheetJS/sheetjs/raw/master/demos/sample.xlsx https://dumps.wikimedia.org/other/static_html_dumps/current_en.wikipedia.org.tar.gz https://arxiv.org/pdf/quant-ph/0410100.pdf https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3 https://www.gov.uk/government/uploads/system/uploads/attachment_data/file/229154/01_how_to_write_a_paper.pdf https://calhoun.nps.edu/bitstream/handle/10945/39080/doc1.doc?sequence=1 https://filesamples.com/samples/video/mp4/sample_640x360.mp4 https://media.w3.org/2010/05/sintel/trailer_hd.mp4 https://www.fao.org/tempref/docrep/fao/011/ai044e/ai044e00.xls https://www.eff.org/document/case-study-powerpoint-presentation https://openknowledge.worldbank.org/bitstream/handle/10986/35207/9781464814353.pdf https://sample-videos.com/doc/Sample-doc-file-for-testing.docx',
    0,
    NULL,
    '2024-11-16 11:07:46'
  ),
  (
    58,
    3,
    1731545186908,
    'TEXT',
    'https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_big.jpg',
    0,
    NULL,
    '2024-11-16 11:08:27'
  ),
  (
    59,
    3,
    1731545186908,
    'TEXT',
    'https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_big.jpg',
    0,
    NULL,
    '2024-11-16 11:10:18'
  ),
  (
    60,
    5,
    1731545222919,
    'TEXT',
    'hello kiba acho',
    0,
    NULL,
    '2024-11-16 11:12:25'
  ),
  (
    61,
    3,
    1731545222919,
    'TEXT',
    'ami valo achi',
    0,
    NULL,
    '2024-11-16 11:12:30'
  ),
  (
    62,
    3,
    1731545222919,
    'TEXT',
    'tumi kibe acho',
    0,
    NULL,
    '2024-11-16 11:12:39'
  ),
  (
    63,
    3,
    1731545222919,
    'TEXT',
    'https://www.w3schools.com/w3css/img_lights.jpg',
    0,
    NULL,
    '2024-11-16 11:16:20'
  ),
  (
    64,
    3,
    1731545186908,
    'TEXT',
    'https://www.nist.gov/document/cybersecurity-framework-pdf https://grants.nih.gov/grants/how-to-apply-application-guide/forms/family/form-f/pph-398.pdf https://www.niaid.nih.gov/sites/default/files/K99-R00-SampleApplication-2020.docx https://www.archives.gov/files/research/genealogy/charts-forms/natarch-pedigree-chart.xlsx https://www.cdc.gov/brfss/questionnaires/pdf-ques/2021-BRFSS-Questionnaire-ENG.xlsx https://video.nationalgeographic.com/video/00000144-0a24-d3cb-a96c-7b2fe1450000 https://files.ncbi.nlm.nih.gov/video/sample_video.mp4 https://www.soundjay.com/button/beep-07.mp3 https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav https://www.sample-videos.com/video123/mp4/480/asdasd.mp4 https://www.niaid.nih.gov/sites/default/files/sample-grant.docx https://www.epa.gov/sites/default/files/2020-01/sample-presentation.ppt https://www.nih.gov/sites/default/files/2021/presentation-sample.pptx https://www.nist.gov/system/files/documents/2017/05/09/CloudComputing.pdf https://www.fda.gov/media/124638/download https://www.cdc.gov/diabetes/data/statistics-report/2020-national-diabetes-statistics-report.xlsx https://download.samplelib.com/mp4/sample-5s.mp4 https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/855630/UK_Government_Digital_Service.pdf https://www.unicef.org/sites/default/files/2020-04/COVID-19-parenting-tips.pdf https://www.w3schools.com/w3css/img_lights.jpg https://www.nasa.gov/sites/default/files/thumbnails/image/nasa-logo-web-rgb.png https://images.unsplash.com/photo-1542089363-c3bd38516e4b https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_big.jpg https://www.irs.gov/pub/irs-pdf/fw4.pdf https://www.oecd.org/finance/financial-markets/48742056.pdf https://www.openoffice.org/documentation/tutorials/PDFexport/sample-file.docx https://ia802508.us.archive.org/5/items/testmp3testfile/mpthreetest.mp3 https://people.sc.fsu.edu/~jburkardt/data/csv/airtravel.csv https://sampleswap.org/samples-ghost/DRUMS%20(SINGLE%20HITS)/hi-hats/36[kb]909-hat-open.wav.mp3 https://www.who.int/docs/default-source/coronaviruse/who-china-joint-mission-on-covid-19-final-report.pdf https://storage.googleapis.com/web-dev-assets/video-and-source/video.mp4 https://unesdoc.unesco.org/ark:/48223/pf0000233321 https://upload.wikimedia.org/wikipedia/commons/a/a3/Eiffel_Tower_Paris_July_2015.jpg https://ccrma.stanford.edu/~jos/mp3/sample.mp3 https://file-examples.com/wp-content/uploads/2017/11/file_example_MP3_700KB.mp3 https://github.com/SheetJS/sheetjs/raw/master/demos/sample.xlsx https://dumps.wikimedia.org/other/static_html_dumps/current_en.wikipedia.org.tar.gz https://arxiv.org/pdf/quant-ph/0410100.pdf https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3 https://www.gov.uk/government/uploads/system/uploads/attachment_data/file/229154/01_how_to_write_a_paper.pdf https://calhoun.nps.edu/bitstream/handle/10945/39080/doc1.doc?sequence=1 https://filesamples.com/samples/video/mp4/sample_640x360.mp4 https://media.w3.org/2010/05/sintel/trailer_hd.mp4 https://www.fao.org/tempref/docrep/fao/011/ai044e/ai044e00.xls https://www.eff.org/document/case-study-powerpoint-presentation https://openknowledge.worldbank.org/bitstream/handle/10986/35207/9781464814353.pdf https://sample-videos.com/doc/Sample-doc-file-for-testing.docx',
    0,
    NULL,
    '2024-11-16 11:16:49'
  ),
  (
    65,
    3,
    1731545186908,
    'TEXT',
    'sfsdf',
    0,
    NULL,
    '2024-11-16 11:17:38'
  ),
  (
    66,
    3,
    1731545186908,
    'TEXT',
    'fsdf',
    0,
    NULL,
    '2024-11-16 11:18:18'
  ),
  (
    67,
    3,
    1731545186908,
    'TEXT',
    'xxxxxxxxx',
    0,
    NULL,
    '2024-11-16 11:22:29'
  ),
  (
    68,
    3,
    1731545186908,
    'TEXT',
    'https://www.google.com/search?sca_esv=d29dcacd0903cf12&sxsrf=ADLYWILEAQEb5iyLiHKVnEzHDy2e5NPgvA:1731754895212&q=freepik&udm=2&fbs=AEQNm0Aa4sjWe7Rqy32pFwRj0UkWd8nbOJfsBGGB5IQQO6L3JyJJclJuzBPl12qJyPx7ESJehObpS5jg6J88CCM-RK725uTmAZpGaaQNHAssOKTZzECPFMslQXapzfpK-ojP0SGWQr39BbxQfYNVzT9U9g6alGwb1mD-7hWXHz-1LQlktMJybxs&sa=X&sqi=2&ved=2ahUKEwjN1_fa2eCJAxWcwzgGHTDBIJwQtKgLegQIHBAB&biw=1536&bih=742&dpr=1.25#vhid=qc9jBHs0w8pzNM&vssid=mosaic',
    0,
    NULL,
    '2024-11-16 11:22:57'
  ),
  (
    69,
    3,
    1731545222919,
    'TEXT',
    'Skip to main contentTurn off continuous scrolling Accessibility help Accessibility feedback freepik    Logo  Template  Poster  Flower  Wallpaper  Free vector  Pattern  Eid mubarak  Floral  Wedding invitation  Menu  Clipart  Mockup  Fashion  Happy  Texture  Restaurant  Mobile  Digital marketing  Music  Gold  Student  Instagram  Raksha bandhan  Vintage  Gradient  Freepik company  Abstract background  Freepik contributor  Freepik subscription  Banner  Business  App  Freepik  Facebook Freepik Freepik | Create great designs, faster  www.freepik.com Freepik | Create great designs, faster About us | Freepik  Freepik About us | Freepik Sell Photos, Vectors and PSD and make ...  Freepik Sell Photos, Vectors and PSD and make ... Freepik: a contributor review | Xpiks Blog  Xpiks Freepik: a contributor review | Xpiks Blog Freepik: Design & edit with AI - Apps ...  Google Play Freepik: Design & edit with AI - Apps ... Freepik review (2024): Pros, cons ...  Photutorial Freepik review (2024): Pros, cons ... Abstract Wallpaper Websites Images ...  Freepik Abstract Wallpaper Websites Images ... Style Creative Background Vectors & ...  Freepik Style Creative Background Vectors & ... Creativity Images - Free Download on ...  Freepik Creativity Images - Free Download on ... Fond Design Vectors & Illustrations for ...  Freepik Fond Design Vectors & Illustrations for ... Freepik Yearly Subscription - Mamun Academy  Mamun Academy · In stock Freepik Yearly Subscription - Mamun Academy Free Vectors to Download | Freepik  Freepik Free Vectors to Download | Freepik Freepik License & Terms Of Use (2024 Guide)  Photutorial Freepik License & Terms Of Use (2024 Guide) Banner Vectors & Illustrations for Free ...  Freepik Banner Vectors & Illustrations for Free ... Freepik  EQT Freepik Page 34 | Outline Logo Green Images ...  Freepik Page 34 | Outline Logo Green Images ... Page 3 | Vibrant Background Vectors ...  Freepik Page 3 | Vibrant Background Vectors ... How to Download Higher Resolution Image ...  YouTube How to Download Higher Resolution Image ... Digital Vectors & Illustrations for ...  Freepik Digital Vectors & Illustrations for ... Sell Photos, Vectors and PSD and make ...  Freepik Sell Photos, Vectors and PSD and make ... Work Images - Free Download on Freepik  Freepik Work Images - Free Download on Freepik freepik Logo PNG Vector SVG, EPS, Ai ...  CDNLogo freepik Logo PNG Vector SVG, EPS, Ai ... Page 18 | Cool Free Backgrounds Vectors ...  Freepik Page 18 | Cool Free Backgrounds Vectors ... Related searches  freepik girl  background  poster design freepik Page 85 | Designer Images - Free ...  Freepik Page 85 | Designer Images - Free ... Page 23 | Fondos De Back Ground Images ...  Freepik Page 23 | Fondos De Back Ground Images ... Page 77 | Design Background Images ...  Freepik Page 77 | Design Background Images ... Business infographic flat design with ...  Freepik Business infographic flat design with ... Thoughts on the Freepik new logo? : r ...  Reddit Thoughts on the Freepik new logo? : r ... Freepik Photos, Images & Pictures ...  Shutterstock Freepik Photos, Images & Pictures ... Free icons designed by Freepik | Flaticon  Flaticon Free icons designed by Freepik | Flaticon Poster Images - Free Download on Freepik  Freepik Poster Images - Free Download on Freepik Freepik Rebrands To Champion Creativity ...  Haldoor Academy Freepik Rebrands To Champion Creativity ... February, the month of love? At Freepik ...  LinkedIn February, the month of love? At Freepik ... Page 24 | Facebook Twitter Logo Vectors ...  Freepik Page 24 | Facebook Twitter Logo Vectors ... Premium Vector | Freepik design  Freepik Premium Vector | Freepik design Free Vectors to Download | Freepik  Freepik Free Vectors to Download | Freepik People Images - Free Download on Freepik  Freepik People Images - Free Download on Freepik Freepik in 2024 - Reviews, Features ...  PAT Research Freepik in 2024 - Reviews, Features ... Offer Images - Free Download on Freepik  Freepik Offer Images - Free Download on Freepik Page 93 | Background Images - Free ...  Freepik Page 93 | Background Images - Free ... FREEPIK EDITOR TUTORIAL | EDIT DESIGN ...  YouTube FREEPIK EDITOR TUTORIAL | EDIT DESIGN ... Book Images - Free Download on Freepik  Freepik Book Images - Free Download on Freepik Page 16 | Graphics Download Images ...  Freepik Page 16 | Graphics Download Images ... Infographic Images - Free Download on ...  Freepik Infographic Images - Free Download on ... How to download Freepik images ...  Freepik Support ? Freepik Support How to download Freepik images ... Business Flyer Vectors & Illustrations ...  Freepik Business Flyer Vectors & Illustrations ... Company Images - Free Download on Freepik  Freepik Company Images - Free Download on Freepik Related searches  freepik pictures  freepik images free download  wallpaper freepik Freepik Reviews | Read Customer Service ...  Trustpilot Freepik Reviews | Read Customer Service ... Shapes Images - Free Download on Freepik  Freepik Shapes Images - Free Download on Freepik Business Management Images - Free ...  Freepik Business Management Images - Free ... Freepik (freepik) - Profile | Pinterest  Pinterest Freepik (freepik) - Profile | Pinterest Freepik - Download this vector: https ...  Facebook Freepik - Download this vector: https ... Freepik Group Buy at 499 Taka For 30 ...  SEO TOOL BD Freepik Group Buy at 499 Taka For 30 ... About Us Images - Free Download on Freepik  Freepik About Us Images - Free Download on Freepik Login Images - Free Download on Freepik  Freepik Login Images - Free Download on Freepik Technology Images - Free Download on ...  Freepik Technology Images - Free Download on ... Is freepik.com down or not working ...  Uptime.com Is freepik.com down or not working ... Graphics Vectors & Illustrations for ...  Freepik Graphics Vectors & Illustrations for ... Abstract Pictures | Freepik  Freepik Abstract Pictures | Freepik Family Images - Free Download on Freepik  Freepik Family Images - Free Download on Freepik Freepik Background Hd Vectors ...  Freepik Freepik Background Hd Vectors ... Water Design Images - Free Download on ...  Freepik Water Design Images - Free Download on ... Page 33 | Background Concept Vectors ...  Freepik Page 33 | Background Concept Vectors ... Freepik Upload Vectors & Illustrations ...  Freepik Freepik Upload Vectors & Illustrations ... Free icons designed by Freepik | Flaticon  Flaticon Free icons designed by Freepik | Flaticon Page 59 | Forma De Fondo Images - Free ...  Freepik Page 59 | Forma De Fondo Images - Free ... Freepik png images | PNGEgg  PNGEgg Freepik png images | PNGEgg Travel Images - Free Download on Freepik  Freepik Travel Images - Free Download on Freepik Website Design Background Images ...  Freepik Website Design Background Images ... Brochure Images - Free Download on Freepik  Freepik Brochure Images - Free Download on Freepik Design Images - Free Download on Freepik  Freepik Design Images - Free Download on Freepik Related searches  freepik logo  freepik design  freepik images Free Vector | Landing page template for ...  Freepik Free Vector | Landing page template for ... Location Images - Free Download on Freepik  Freepik Location Images - Free Download on Freepik Freepik review (2024): Pros, cons ...  Photutorial Freepik review (2024): Pros, cons ... Blue Background Vectors & Illustrations ...  Freepik Blue Background Vectors & Illustrations ... freepik tutorial in hindi | freepik ...  YouTube freepik tutorial in hindi | freepik ... Education Images - Free Download on Freepik  Freepik Education Images - Free Download on Freepik img.freepik.com/free-vector/flat-nature-landing-pa...  www.freepik.com img.freepik.com/free-vector/flat-nature-landing-pa... Freepik | Create great designs, faster  Pinterest Freepik | Create great designs, faster Freepik PNG Transparent Images Free ...  Pngtree Freepik PNG Transparent Images Free ... Freepik Image Free Downloader | Freepik ...  Codify Formatter Freepik Image Free Downloader | Freepik ... Freepik Stock Illustrations – 961 ...  Dreamstime.com Freepik Stock Illustrations – 961 ... Starline Author Portfolio | Freepik  Freepik Starline Author Portfolio | Freepik Page 81 | Digital Net Images - Free ...  Freepik Page 81 | Digital Net Images - Free ... Freepik - Freepik Premium for life? It ...  Facebook Freepik - Freepik Premium for life? It ... How to Download Premium Images for Free ...  YouTube How to Download Premium Images for Free ... Flat geometric background | Premium AI ...  Freepik Flat geometric background | Premium AI ... Freepik logo PNG, vector file in (SVG ...  Pinterest Freepik logo PNG, vector file in (SVG ... Flyer Design Images - Free Download on ...  Freepik Flyer Design Images - Free Download on ... EQT acquires freemium graphics and ...  TechCrunch EQT acquires freemium graphics and ... Freepik: Design & edit with AI on the ...  App Store - Apple Freepik: Design & edit with AI on the ... Get FreePik Premium Yearly – Premium At ...  Premium At Cheap Get FreePik Premium Yearly – Premium At ... Freepik Premium Subscription - Marts BD  Marts BD Freepik Premium Subscription - Marts BD FreePik Premium -KeySewa.Com  KeySewa FreePik Premium -KeySewa.Com Freepik PNG Transparent Images Free ...  Pngtree Freepik PNG Transparent Images Free ... Related searches  freepik background  flower freepik  pattern freepik More results  Freepik     Page 25 | Abstract Wallpaper Websites Images - Free Download on Freepik  Page 25 | Abstract Wallpaper Websites Images - Free Download on Freepik Images may be subject to copyright. Learn More Abstarct Background Images - Free Download on Freepik  Freepik Abstarct Background Images - Free Download on Freepik Blue Background Design Vectors & Illustrations for Free Download | Freepik  Freepik Blue Background Design Vectors & Illustrations for Free Download | Freepik Premium Vector | Modern dark blue abstract background paper shine and layer  element vector for presentation design Suit for business corporate  institution party festive seminar and talks  Freepik Premium Vector | Modern dark blue abstract background paper shine and layer element vector for presentation design Suit for business corporate institution party festive seminar and talks Modern black and blue abstract background with a minimalistic design |  Premium AI-generated image  Freepik Modern black and blue abstract background with a minimalistic design | Premium AI-generated image Premium Vector | Background Images Free Download on Freepik  Freepik Premium Vector | Background Images Free Download on Freepik Premium Vector | Blue abstract background  Freepik Premium Vector | Blue abstract background Page 5 | Simple Abstract Background Images - Free Download on Freepik  Freepik Page 5 | Simple Abstract Background Images - Free Download on Freepik Page 4 | Navy White Background Images - Free Download on Freepik  Freepik Page 4 | Navy White Background Images - Free Download on Freepik Background Blue Images - Free Download on Freepik  Freepik Background Blue Images - Free Download on Freepik Free Vector | Abstract wavy futuristic background  Freepik Free Vector | Abstract wavy futuristic background Page 8 | Blue L Images - Free Download on Freepik  Freepik Page 8 | Blue L Images - Free Download on Freepik Background Blue Images - Free Download on Freepik  Freepik Background Blue Images - Free Download on Freepik See more Related searches  abstract blue and purple background  freepik background  blue wave vector png  freepik design Send feedback Get help Saved',
    0,
    NULL,
    '2024-11-16 11:24:13'
  ),
  (
    70,
    3,
    1731545222919,
    'TEXT',
    'https://techcrunch.com/wp-content/uploads/2020/05/2902348.jpg',
    0,
    NULL,
    '2024-11-16 11:26:02'
  ),
  (
    71,
    3,
    1731545186908,
    'TEXT',
    'https://techcrunch.com/wp-content/uploads/2020/05/2902348.jpg',
    0,
    NULL,
    '2024-11-16 11:26:10'
  ),
  (
    72,
    3,
    1731545186908,
    'TEXT',
    'https://techcrunch.com/wp-content/uploads/2020/05/2902348.jpg',
    0,
    NULL,
    '2024-11-16 11:32:20'
  ),
  (
    73,
    3,
    1731545186908,
    'TEXT',
    'https://techcrunch.com/wp-content/uploads/2020/05/2902348.jpg',
    0,
    NULL,
    '2024-11-16 11:32:24'
  ),
  (
    74,
    3,
    1731545186908,
    'TEXT',
    'Friends  Room_1731545186908 Group Chat Last message: 11/16/2024, 5:32:24 PM Michael Brown Michael Brown Private Chat Last message: 11/16/2024, 5:32:24 PM Michael Brown Michael Brown Private Chat Last message: 11/16/2024, 5:32:24 PM Michael Brown Michael Brown Private Chat Last message: 11/16/2024, 5:32:24 PM Michael Brown Michael Brown Private Chat Last message: 11/16/2024, 5:32:24 PM Michael Brown Michael Brown Private Chat Last message: 11/16/2024, 5:32:24 PM Emma Johnson Emma Johnson Private Chat Last message: 11/16/2024, 5:32:24 PM Emma Johnson Emma Johnson Private Chat Last message: 11/16/2024, 5:32:24 PM Emma Johnson Emma Johnson Private Chat Last message: 11/16/2024, 5:32:24 PM Emma Johnson Emma Johnson Private Chat Last message: 11/16/2024, 5:32:24 PM Emma Johnson Emma Johnson Private Chat Last message: 11/16/2024, 5:32:24 PM Emma Johnson Emma Johnson Private Chat Last message: 11/16/2024, 5:32:24 PM Emma Johnson Emma Johnson Private Chat Last message: 11/16/2024, 5:32:24 PM Emma Johnson Emma Johnson Private Chat Last message: 11/16/2024, 5:32:24 PM Emma Johnson Emma Johnson Private Chat Last message: 11/16/2024, 5:32:24 PM Emma Johnson Emma Johnson Private Chat Last message: 11/16/2024, 5:32:24 PM  Room_1731545186908 Group Chat Emma Johnson Emma Johnson sfsdf  Yesterday Michael Brown Michael Brown sfsf  Yesterday Michael Brown Michael Brown fsdf  Yesterday You fsfd  Yesterday Emma Johnson Emma Johnson fsdf  Yesterday Emma Johnson Emma Johnson fsdfd  Yesterday Emma Johnson Emma Johnson fsdff  Yesterday Emma Johnson Emma Johnson fsdf  Yesterday Emma Johnson Emma Johnson Yesterday You Yesterday You Yesterday You Yesterday Michael Brown Michael Brown sdfsdfsfsfsdfsf  Yesterday You fsfffs  Yesterday Emma Johnson Emma Johnson gfdfdfdsfdsfsdf  Yesterday You fsdfsdfsdfsd  Yesterday You fdfd  Yesterday You fsdfsdffsdfsdf  Yesterday Emma Johnson Emma Johnson fsdf  Yesterday Emma Johnson Emma Johnson fsdf  Yesterday Emma Johnson Emma Johnson fsdf  Yesterday Emma Johnson Emma Johnson fsd  Yesterday Michael Brown Michael Brown fsdf  Yesterday You x.com  Yesterday Emma Johnson Emma Johnson hello guys  Yesterday Emma Johnson Emma Johnson okdy done  Yesterday Emma Johnson Emma Johnson everything okey?  Yesterday Emma Johnson Emma Johnson yes  Yesterday Michael Brown Michael Brown wos  Yesterday Emma Johnson Emma Johnson yo yo  Today Michael Brown Michael Brown fsdf  Today You x.com  Today Emma Johnson Emma Johnson sfsdf  Today Emma Johnson Emma Johnson Sample PDF Document Download PDF https://drive.google.com/file/d/1t-Rj09fpVwZdLvKb5vHfGVnMYYI7Sm1t/view?usp=sharing Purple Pi Avatar Message Image Marcimus Avatar Message Image Sample YouTube Video https://www.youtube.com/watch?v=dQw4w9WgXcQ Pexels Stock Video Freesound Sample Audio  Today Emma Johnson Emma Johnson Check out this cool image! Message Image https://example.com  Today Emma Johnson Emma Johnson Check out this cool image! Message Image Download PDF  Today Emma Johnson Emma Johnson Check out this cool image! Message Image https://example.com  Today Michael Brown Michael Brown [ { \"url\": \" \", \"type\": \"video\" }, { \"url\": \" Message Image \", \"type\": \"image\" }, { \"url\": \" \", \"type\": \"audio\" }, { \"url\": \" Download PDF \", \"type\": \"document\" } ]  Today Michael Brown Michael Brown \' Download PDF \', // PDF file \' Download Document \', // Word document \' Download Excel \', // Excel file \' Download Presentation \', // PowerPoint file \' Download File \' // Other document  Today You \' Download PDF \', // PDF file \' Download Document \', // Word document \' Download Excel \', // Excel file \' Download Presentation \', // PowerPoint file \' Download File \' // Other document  Today You sfsdf  Today You Message Image  Today You data:image/png;base64,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  Today You https://img.freepik.com/free-photo/colorful-triangle-paper-pack-desk_23-2148547767.jpg?t=st=1731754963~exp=1731758563~hmac=067bce4e12c143a5805f132d982d41db3f70291e6bbf0b338d135f60c5be63b0&w=1060  Today You Message Image  Today You fsdf  Today Michael Brown Michael Brown Message Image  Today Michael Brown Michael Brown Message Image  Today You Message Image  Today Michael Brown Michael Brown https://www.nist.gov/document/cybersecurity-framework-pdf Download PDF Download Document Download Excel Download Excel https://video.nationalgeographic.com/video/00000144-0a24-d3cb-a96c-7b2fe1450000 Download Document Download Presentation Download Presentation Download PDF https://www.fda.gov/media/124638/download Download Excel Download PDF Download PDF Message Image Message Image https://images.unsplash.com/photo-1542089363-c3bd38516e4b Message Image Download PDF Download PDF Download Document Download File Download PDF https://unesdoc.unesco.org/ark:/48223/pf0000233321 Message Image Download Excel https://dumps.wikimedia.org/other/static_html_dumps/current_en.wikipedia.org.tar.gz Download PDF Download PDF https://calhoun.nps.edu/bitstream/handle/10945/39080/doc1.doc?sequence=1 Download Excel https://www.eff.org/document/case-study-powerpoint-presentation Download PDF Download Document  Today You Message Image  Today You Message Image  Today You https://www.nist.gov/document/cybersecurity-framework-pdf Download PDF Download Document Download Excel Download Excel https://video.nationalgeographic.com/video/00000144-0a24-d3cb-a96c-7b2fe1450000 Download Document Download Presentation Download Presentation Download PDF https://www.fda.gov/media/124638/download Download Excel Download PDF Download PDF Message Image Message Image https://images.unsplash.com/photo-1542089363-c3bd38516e4b Message Image Download PDF Download PDF Download Document Download File Download PDF https://unesdoc.unesco.org/ark:/48223/pf0000233321 Message Image Download Excel https://dumps.wikimedia.org/other/static_html_dumps/current_en.wikipedia.org.tar.gz Download PDF Download PDF https://calhoun.nps.edu/bitstream/handle/10945/39080/doc1.doc?sequence=1 Download Excel https://www.eff.org/document/case-study-powerpoint-presentation Download PDF Download Document  Today You sfsdf  Today You fsdf  Today You xxxxxxxxx  Today You https://www.google.com/search?sca_esv=d29dcacd0903cf12&sxsrf=ADLYWILEAQEb5iyLiHKVnEzHDy2e5NPgvA:1731754895212&q=freepik&udm=2&fbs=AEQNm0Aa4sjWe7Rqy32pFwRj0UkWd8nbOJfsBGGB5IQQO6L3JyJJclJuzBPl12qJyPx7ESJehObpS5jg6J88CCM-RK725uTmAZpGaaQNHAssOKTZzECPFMslQXapzfpK-ojP0SGWQr39BbxQfYNVzT9U9g6alGwb1mD-7hWXHz-1LQlktMJybxs&sa=X&sqi=2&ved=2ahUKEwjN1_fa2eCJAxWcwzgGHTDBIJwQtKgLegQIHBAB&biw=1536&bih=742&dpr=1.25#vhid=qc9jBHs0w8pzNM&vssid=mosaic  Today You Message Image  Today You Message Image  Today You Message Image  Today ?   Type your message...',
    0,
    NULL,
    '2024-11-16 11:32:28'
  ),
  (
    75,
    3,
    1731545222919,
    'TEXT',
    'dsfs',
    0,
    NULL,
    '2024-11-16 11:59:53'
  ),
  (
    76,
    3,
    1731545222919,
    'TEXT',
    'fsdf',
    0,
    NULL,
    '2024-11-16 12:01:46'
  ),
  (
    77,
    261,
    1731549497693,
    'TEXT',
    'fsdf',
    0,
    NULL,
    '2024-11-16 12:01:54'
  ),
  (
    78,
    261,
    1731549496464,
    'TEXT',
    'fsdf',
    0,
    NULL,
    '2024-11-16 12:01:58'
  ),
  (
    79,
    5,
    1731545186908,
    'TEXT',
    'fsdf',
    0,
    NULL,
    '2024-11-16 12:02:40'
  ),
  (
    80,
    5,
    1731546935266,
    'TEXT',
    'fsdf',
    0,
    NULL,
    '2024-11-16 12:05:26'
  ),
  (
    81,
    5,
    1731545186908,
    'TEXT',
    'xxxxxx',
    0,
    NULL,
    '2024-11-16 12:05:40'
  ),
  (
    82,
    5,
    1731545186908,
    'TEXT',
    '8The resource <URL> was preloaded using link preload but not used within a few seconds from the window\'s load event. Please make sure it has an appropriate `as` value and it is preloaded intentionally.Understand this warningAI hot-reloader-client.tsx:297 [Fast Refresh] rebuilding hot-reloader-client.tsx:74 [Fast Refresh] done in 83ms SourceMap \"data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpudWxsLCJzZWN0aW9ucyI6W3sib2Zmc2V0Ijp7ImxpbmUiOjMsImNvbHVtbiI6MH0sInVybCI6bnVsbCwibWFwIjp7InZlcnNpb24iOjMsInNvdXJjZXMiOlsiL3R1cmJvcGFjay9bcHJvamVjdF0vc3JjL2NvbXBvbmVudHMvRnJpZW5kTGlzdC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgQG5leHQvbmV4dC9uby1pbWctZWxlbWVudCAqL1xyXG5pbXBvcnQgUmVhY3QsIHsgRGlzcGF0Y2gsIFNldFN0YXRlQWN0aW9uIH0gZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgeyBDaGF0Um9vbVR5cGUsIFVzZXJEZXRhaWxzVHlwZSB9IGZyb20gJy4vbWVzc2FnZXMnO1xyXG5pbXBvcnQgeyBUeXBpbmdUeXBlIH0gZnJvbSAnLi91c2VXUyc7XHJcblxyXG5pbnRlcmZhY2UgRnJpZW5kTGlzdFByb3BzIHtcclxuICAgIHJvb21zOiBDaGF0Um9vbVR5cGVbXTtcclxuICAgIHR5cGluZzogVHlwaW5nVHlwZSxcclxuICAgIG9ubGluZTogKG51bWJlciB8IHN0cmluZylbXTtcclxuICAgIG9uU2VsZWN0RnJpZW5kOiAoZnJpZW5kOiBudW1iZXIgfCBzdHJpbmcpID0+IHZvaWQ7XHJcbiAgICB1c2VyX2RldGFpbHM6IFVzZXJEZXRhaWxzVHlwZSxcclxuICAgIHJvb206IENoYXRSb29tVHlwZSxcclxuICAgIHNldFJvb206IERpc3BhdGNoPFNldFN0YXRlQWN0aW9uPENoYXRSb29tVHlwZT4+XHJcbn1cclxuXHJcbmNvbnN0IEZyaWVuZExpc3Q6IFJlYWN0LkZDPEZyaWVuZExpc3RQcm9wcz4gPSAoe1xyXG4gICAgdHlwaW5nLFxyXG4gICAgcm9vbXMsXHJcbiAgICByb29tLFxyXG4gICAgc2V0Um9vbSxcclxuICAgIG9ubGluZSxcclxuICAgIG9uU2VsZWN0RnJpZW5kLFxyXG4gICAgdXNlcl9kZXRhaWxzLFxyXG59KSA9PiB7XHJcblxyXG5cclxuICAgIC8vIEZ1bmN0aW9uIHRvIGNoZWNrIGlmIGEgc3BlY2lmaWMgZnJpZW5kIGlzIHR5cGluZ1xyXG4gICAgY29uc3QgaXNGcmllbmRUeXBpbmcgPSAoZnJpZW5kOiBudW1iZXIgfCBzdHJpbmcpID0+IHtcclxuICAgICAgICBjb25zdCBmcmllbmRUeXBpbmdTdGF0dXMgPSB0eXBpbmcuZmluZChcclxuICAgICAgICAgICAgKHQpID0+IHQ/LnJlY2lwaWVudF9pZCA9PSBmcmllbmQgJiYgdD8udHlwaW5nXHJcbiAgICAgICAgKTtcclxuICAgICAgICByZXR1cm4gISFmcmllbmRUeXBpbmdTdGF0dXM7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIEZ1bmN0aW9uIHRvIGNoZWNrIGlmIGEgZnJpZW5kIGlzIG9ubGluZVxyXG5cclxuICAgIC8vIGNvbnN0IHJvdXRlciA9IHVzZVJvdXRlcigpO1xyXG5cclxuICAgIGNvbnN0IG9uQ3JlYXRlUm9vbUlESGFuZGxlID0gYXN5bmMgKHI6IENoYXRSb29tVHlwZSkgPT4ge1xyXG4gICAgICAgIHNldFJvb20ocilcclxuICAgICAgICAvLyBjb25zdCB7IGRhdGEgfSA9IGF3YWl0IGF4aW9zLnBvc3QoTUVTU0FHRVMuQ0hBVF9ST09NLkNSRUFURV9DSEFUX1JPT00sIHtcclxuICAgICAgICAvLyAgICAgdXNlcl9pZDogMjYxLFxyXG4gICAgICAgIC8vICAgICByZWNpcGllbnRfaWQ6IDNcclxuICAgICAgICAvLyB9KTtcclxuICAgICAgICAvLyBpZiAoZGF0YT8uc3VjY2Vzcykge1xyXG4gICAgICAgIC8vIHJvdXRlci5wdXNoKGAvJHtkYXRhPy5yb29tX2lkfWApXHJcbiAgICAgICAgLy8gb25TZWxlY3RGcmllbmQocilcclxuICAgICAgICAvLyB9XHJcbiAgICAgICAgLy8gZWxzZSB7XHJcbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKGRhdGEpXHJcbiAgICAgICAgLy8gfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAoXHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsIHAtNCBiZy1ncmF5LTEwMCByb3VuZGVkLWxnXCI+XHJcbiAgICAgICAgICAgIDxoMiBjbGFzc05hbWU9XCJ0ZXh0LXhsIGZvbnQtYm9sZCBtYi00XCI+RnJpZW5kczwvaDI+XHJcbiAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICByb29tcy5tYXAoKHIsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzVHlwaW5nID0gaXNGcmllbmRUeXBpbmcocj8ucm9vbV9pZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzT25saW5lID0gb25saW5lPy5pbmNsdWRlcyhyPy5yZWNpcGllbnRfaWQgfHwgcj8ucm9vbV9pZCkgfHwgQm9vbGVhbihyPy5pc19ncm91cCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzU2VsZWN0ZWQgPSByb29tPy5yb29tX2lkID09PSByPy5yb29tX2lkO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5PXtpbmRleH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2Ake2lzU2VsZWN0ZWQgPyAnYmctYmx1ZS02MDAgdGV4dC13aGl0ZSBmb250LXNlbWlib2xkJyA6ICdjdXJzb3ItcG9pbnRlciBiZy13aGl0ZSBob3ZlcjpiZy1ibHVlLTEwMCByZWxhdGl2ZSd9IHB5LTIgcHgtNCByZWxhdGl2ZSByb3VuZGVkIG1iLTIgZmxleCBqdXN0aWZ5LWJldHdlZW4gaXRlbXMtY2VudGVyIGNhcGl0YWxpemVgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IG9uQ3JlYXRlUm9vbUlESGFuZGxlKHIpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgc3BhY2UteC0zXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsvKiBQcm9maWxlIEltYWdlICovfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0ncmVsYXRpdmUnPlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy0xMCBoLTEwIHJvdW5kZWQtZnVsbCBvdmVyZmxvdy1oaWRkZW4gYmctZ3JheS0yMDAgZmxleC1zaHJpbmstMFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgci50aHVtYm5haWwgPyAoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW1nXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjPXtyLnRodW1ibmFpbH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbHQ9e3Iucm9vbV9uYW1lfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGwgb2JqZWN0LWNvdmVyXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkgOiAoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICUnderstand this warningAI hot-reloader-client.tsx:74 [Fast Refresh] done in 149ms 2SourceMap \"data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpudWxsLCJzZWN0aW9ucyI6W3sib2Zmc2V0Ijp7ImxpbmUiOjMsImNvbHVtbiI6MH0sInVybCI6bnVsbCwibWFwIjp7InZlcnNpb24iOjMsInNvdXJjZXMiOlsiL3R1cmJvcGFjay9bcHJvamVjdF0vc3JjL2NvbXBvbmVudHMvRnJpZW5kTGlzdC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgQG5leHQvbmV4dC9uby1pbWctZWxlbWVudCAqL1xyXG5pbXBvcnQgUmVhY3QsIHsgRGlzcGF0Y2gsIFNldFN0YXRlQWN0aW9uIH0gZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgeyBDaGF0Um9vbVR5cGUsIFVzZXJEZXRhaWxzVHlwZSB9IGZyb20gJy4vbWVzc2FnZXMnO1xyXG5pbXBvcnQgeyBUeXBpbmdUeXBlIH0gZnJvbSAnLi91c2VXUyc7XHJcblxyXG5pbnRlcmZhY2UgRnJpZW5kTGlzdFByb3BzIHtcclxuICAgIHJvb21zOiBDaGF0Um9vbVR5cGVbXTtcclxuICAgIHR5cGluZzogVHlwaW5nVHlwZSxcclxuICAgIG9ubGluZTogKG51bWJlciB8IHN0cmluZylbXTtcclxuICAgIG9uU2VsZWN0RnJpZW5kOiAoZnJpZW5kOiBudW1iZXIgfCBzdHJpbmcpID0+IHZvaWQ7XHJcbiAgICB1c2VyX2RldGFpbHM6IFVzZXJEZXRhaWxzVHlwZSxcclxuICAgIHJvb206IENoYXRSb29tVHlwZSxcclxuICAgIHNldFJvb206IERpc3BhdGNoPFNldFN0YXRlQWN0aW9uPENoYXRSb29tVHlwZT4+XHJcbn1cclxuXHJcbmNvbnN0IEZyaWVuZExpc3Q6IFJlYWN0LkZDPEZyaWVuZExpc3RQcm9wcz4gPSAoe1xyXG4gICAgdHlwaW5nLFxyXG4gICAgcm9vbXMsXHJcbiAgICByb29tLFxyXG4gICAgc2V0Um9vbSxcclxuICAgIG9ubGluZSxcclxuICAgIG9uU2VsZWN0RnJpZW5kLFxyXG4gICAgdXNlcl9kZXRhaWxzLFxyXG59KSA9PiB7XHJcblxyXG5cclxuICAgIC8vIEZ1bmN0aW9uIHRvIGNoZWNrIGlmIGEgc3BlY2lmaWMgZnJpZW5kIGlzIHR5cGluZ1xyXG4gICAgY29uc3QgaXNGcmllbmRUeXBpbmcgPSAoZnJpZW5kOiBudW1iZXIgfCBzdHJpbmcpID0+IHtcclxuICAgICAgICBjb25zdCBmcmllbmRUeXBpbmdTdGF0dXMgPSB0eXBpbmcuZmluZChcclxuICAgICAgICAgICAgKHQpID0+IHQ/LnJlY2lwaWVudF9pZCA9PSBmcmllbmQgJiYgdD8udHlwaW5nXHJcbiAgICAgICAgKTtcclxuICAgICAgICByZXR1cm4gISFmcmllbmRUeXBpbmdTdGF0dXM7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIEZ1bmN0aW9uIHRvIGNoZWNrIGlmIGEgZnJpZW5kIGlzIG9ubGluZVxyXG5cclxuICAgIC8vIGNvbnN0IHJvdXRlciA9IHVzZVJvdXRlcigpO1xyXG5cclxuICAgIGNvbnN0IG9uQ3JlYXRlUm9vbUlESGFuZGxlID0gYXN5bmMgKHI6IENoYXRSb29tVHlwZSkgPT4ge1xyXG4gICAgICAgIHNldFJvb20ocilcclxuICAgICAgICAvLyBjb25zdCB7IGRhdGEgfSA9IGF3YWl0IGF4aW9zLnBvc3QoTUVTU0FHRVMuQ0hBVF9ST09NLkNSRUFURV9DSEFUX1JPT00sIHtcclxuICAgICAgICAvLyAgICAgdXNlcl9pZDogMjYxLFxyXG4gICAgICAgIC8vICAgICByZWNpcGllbnRfaWQ6IDNcclxuICAgICAgICAvLyB9KTtcclxuICAgICAgICAvLyBpZiAoZGF0YT8uc3VjY2Vzcykge1xyXG4gICAgICAgIC8vIHJvdXRlci5wdXNoKGAvJHtkYXRhPy5yb29tX2lkfWApXHJcbiAgICAgICAgLy8gb25TZWxlY3RGcmllbmQocilcclxuICAgICAgICAvLyB9XHJcbiAgICAgICAgLy8gZWxzZSB7XHJcbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKGRhdGEpXHJcbiAgICAgICAgLy8gfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAoXHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsIHAtNCBiZy1ncmF5LTEwMCByb3VuZGVkLWxnXCI+XHJcbiAgICAgICAgICAgIDxoMiBjbGFzc05hbWU9XCJ0ZXh0LXhsIGZvbnQtYm9sZCBtYi00XCI+RnJpZW5kczwvaDI+XHJcbiAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICByb29tcy5tYXAoKHIsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzVHlwaW5nID0gaXNGcmllbmRUeXBpbmcocj8ucm9vbV9pZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzT25saW5lID0gb25saW5lPy5pbmNsdWRlcyhyPy5yZWNpcGllbnRfaWQgfHwgcj8ucm9vbV9pZCkgfHwgQm9vbGVhbihyPy5pc19ncm91cCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzU2VsZWN0ZWQgPSByb29tPy5yb29tX2lkID09PSByPy5yb29tX2lkO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5PXtpbmRleH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2Ake2lzU2VsZWN0ZWQgPyAnYmctYmx1ZS02MDAgdGV4dC13aGl0ZSBmb250LXNlbWlib2xkJyA6ICdjdXJzb3ItcG9pbnRlciBiZy13aGl0ZSBob3ZlcjpiZy1ibHVlLTEwMCByZWxhdGl2ZSd9IHB5LTIgcHgtNCByZWxhdGl2ZSByb3VuZGVkIG1iLTIgZmxleCBqdXN0aWZ5LWJldHdlZW4gaXRlbXMtY2VudGVyIGNhcGl0YWxpemVgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IG9uQ3JlYXRlUm9vbUlESGFuZGxlKHIpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgc3BhY2UteC0zXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsvKiBQcm9maWxlIEltYWdlICovfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0ncmVsYXRpdmUnPlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy0xMCBoLTEwIHJvdW5kZWQtZnVsbCBvdmVyZmxvdy1oaWRkZW4gYmctZ3JheS0yMDAgZmxleC1zaHJpbmstMFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgci50aHVtYm5haWwgPyAoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW1nXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjPXtyLnRodW1ibmFpbH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbHQ9e3Iucm9vbV9uYW1lfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGwgb2JqZWN0LWNvdmVyXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkgOiAoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICUnderstand this warningAI Chat.tsx:76 false [] 3 Chat.tsx:76 false [] 3 useWS.tsx:178 WebSocket connection closed Chat.tsx:76 true (5) [3, 3, 3, 3, 3] 3 Chat.tsx:76 true (5) [3, 3, 3, 3, 3] 3 Chat.tsx:76 true (5) [3, 3, 3, 3, 3] 3 Chat.tsx:76 true (5) [3, 3, 3, 3, 3] 3 Chat.tsx:76 true (5) [3, 3, 3, 3, 3] 3 Chat.tsx:76 true (5) [3, 3, 3, 3, 3] 3 Chat.tsx:76 true (5) [3, 3, 3, 3, 3] 3 Chat.tsx:76 true (5) [3, 3, 3, 3, 3] 3 Chat.tsx:76 true (5) [3, 3, 3, 3, 3] 3 Chat.tsx:76 true (5) [3, 3, 3, 3, 3] 3 Chat.tsx:76 true (5) [3, 3, 3, 3, 3] 3 Chat.tsx:76 true (5) [3, 3, 3, 3, 3] 3 Chat.tsx:76 true (5) [3, 3, 3, 3, 3] 3 Chat.tsx:76 true (5) [3, 3, 3, 3, 3] 3 Chat.tsx:76 true (5) [3, 3, 3, 3, 3] null Chat.tsx:76 true (5) [3, 3, 3, 3, 3] null useWS.tsx:178 WebSocket connection closed Chat.tsx:76 true (5) [3, 3, 3, 3, 3] null Chat.tsx:76 true (5) [3, 3, 3, 3, 3] null hook.js:608 Warning: In HTML, <div> cannot be a descendant of <p>. This will cause a hydration error. Error Component Stack     at div (<anonymous>)     at p (<anonymous>)     at div (<anonymous>)     at div (<anonymous>)     at div (<anonymous>)     at div (<anonymous>)     at MessageItem (MessageItem.tsx:153:55)     at div (<anonymous>)     at ChatBody (ChatBody.tsx:40:5)     at div (<anonymous>)     at div (<anonymous>)     at div (<anonymous>)     at Chat (Chat.tsx:23:19)     at div (<anonymous>)     at RootTemplate (template.tsx:12:38)     at OuterLayoutRouter (layout-router.tsx:532:9)     at body (<anonymous>)     at html (<anonymous>)     at RootLayout [Server] (<anonymous>)     at RedirectErrorBoundary (redirect-boundary.tsx:48:5)     at RedirectBoundary (redirect-boundary.tsx:79:9)     at NotFoundErrorBoundary (not-found-boundary.tsx:32:5)     at NotFoundBoundary (not-found-boundary.tsx:117:9)     at DevRootNotFoundBoundary (dev-root-not-found-boundary.tsx:20:3)     at ReactDevOverlay (ReactDevOverlay.tsx:98:3)     at HotReload (hot-reloader-client.tsx:452:3)     at Router (app-router.tsx:300:9)     at ErrorBoundaryHandler (error-boundary.tsx:68:11)     at ErrorBoundary (error-boundary.tsx:171:9)     at AppRouter (app-router.tsx:716:3)     at ServerRoot (app-index.tsx:126:13)     at Root (app-index.tsx:133:17) overrideMethod @ hook.js:608 push.[project]/node_modules/next/dist/client/app-index.js [app-client] (ecmascript).window.console.error @ app-index.tsx:25 console.error @ hydration-error-info.ts:72 printWarning @ react-dom.development.js:94 error @ react-dom.development.js:68 validateDOMNesting @ react-dom.development.js:4284 createInstance @ react-dom.development.js:35403 completeWork @ react-dom.development.js:19773 completeUnitOfWork @ react-dom.development.js:25963 performUnitOfWork @ react-dom.development.js:25759 workLoopSync @ react-dom.development.js:25464 renderRootSync @ react-dom.development.js:25419 performConcurrentWorkOnRoot @ react-dom.development.js:24504 workLoop @ scheduler.development.js:256 flushWork @ scheduler.development.js:225 performWorkUntilDeadline @ scheduler.development.js:534Understand this errorAI files.ncbi.nlm.nih.gov/video/sample_video.mp4:1                           GET https://files.ncbi.nlm.nih.gov/video/sample_video.mp4 net::ERR_NAME_NOT_RESOLVEDUnderstand this errorAI files.ncbi.nlm.nih.gov/video/sample_video.mp4:1                           GET https://files.ncbi.nlm.nih.gov/video/sample_video.mp4 net::ERR_NAME_NOT_RESOLVEDUnderstand this errorAI 21Chrome is moving towards a new experience that allows users to choose to browse without third-party cookies.Understand this warningAI Chat.tsx:76 true (5) [3, 3, 3, 3, 3] null Chat.tsx:76 true (5) [3, 3, 3, 3, 3] null www.sample-videos.com/video123/mp4/480/asdasd.mp4:1                           GET https://www.sample-videos.com/video123/mp4/480/asdasd.mp4 net::ERR_CERT_COMMON_NAME_INVALIDUnderstand this errorAI www.sample-videos.com/video123/mp4/480/asdasd.mp4:1                           GET https://www.sample-videos.com/video123/mp4/480/asdasd.mp4 net::ERR_CERT_COMMON_NAME_INVALIDUnderstand this errorAI Chat.tsx:76 true (5) [3, 3, 3, 3, 3] null Chat.tsx:76 true (5) [3, 3, 3, 3, 3] null Chat.tsx:76 true (5) [3, 3, 3, 3, 3] null Chat.tsx:76 true (5) [3, 3, 3, 3, 3] null Chat.tsx:76 true (5) [3, 3, 3, 3, 3] null Chat.tsx:76 true (5) [3, 3, 3, 3, 3] null Chat.tsx:76 true (5) [3, 3, 3, 3, 3] null Chat.tsx:76 true (5) [3, 3, 3, 3, 3] null Chat.tsx:76 true (5) [3, 3, 3, 3, 3] null Chat.tsx:76 true (5) [3, 3, 3, 3, 3] null Chat.tsx:76 true (5) [3, 3, 3, 3, 3] null Chat.tsx:76 true (5) [3, 3, 3, 3, 3] null Chat.tsx:76 true (5) [3, 3, 3, 3, 3] null Chat.tsx:76 true (5) [3, 3, 3, 3, 3] null Chat.tsx:76 true (5) [3, 3, 3, 3, 3] null Chat.tsx:76 true (5) [3, 3, 3, 3, 3] null',
    0,
    NULL,
    '2024-11-16 12:05:46'
  ),
  (
    83,
    3,
    1731546935266,
    'TEXT',
    'fsdffffffffffffffff',
    0,
    NULL,
    '2024-11-16 12:42:35'
  ),
  (
    84,
    3,
    1731545186908,
    'TEXT',
    'fsdfffsdfsdfsffsdfffsdffffffsdffsdsssssfsdf',
    0,
    NULL,
    '2024-11-16 12:44:41'
  ),
  (
    85,
    5,
    1731545186908,
    'TEXT',
    'fsdsssssssfsfsdffsfdf',
    0,
    NULL,
    '2024-11-16 12:44:47'
  ),
  (
    86,
    3,
    1731545222919,
    'TEXT',
    'fsdfsfdffsfsdfsdfsdfdf',
    0,
    NULL,
    '2024-11-16 12:45:53'
  ),
  (
    87,
    3,
    1731546935266,
    'TEXT',
    'fgfsffsdfsfd',
    0,
    NULL,
    '2024-11-16 12:49:02'
  ),
  (
    88,
    3,
    1731545186908,
    'TEXT',
    'fsdffsdf',
    0,
    NULL,
    '2024-11-16 13:00:44'
  ),
  (
    89,
    261,
    1731545186908,
    'TEXT',
    'fsdfsd',
    0,
    NULL,
    '2024-11-16 13:01:10'
  ),
  (
    90,
    261,
    1731545186908,
    'TEXT',
    'https://x.com',
    0,
    NULL,
    '2024-11-16 13:01:19'
  ),
  (
    91,
    3,
    1731549497693,
    'TEXT',
    'fff',
    0,
    NULL,
    '2024-11-16 13:02:56'
  ),
  (
    92,
    261,
    1731549497693,
    'TEXT',
    'x',
    0,
    NULL,
    '2024-11-16 13:03:00'
  ),
  (
    93,
    3,
    1731545186908,
    'TEXT',
    'xxfffsdffsf',
    0,
    NULL,
    '2024-11-16 13:09:47'
  ),
  (
    94,
    3,
    1731545186908,
    'TEXT',
    'fsdf',
    0,
    NULL,
    '2024-11-16 13:10:47'
  ),
  (
    95,
    3,
    1731545186908,
    'TEXT',
    'sffsdf',
    0,
    NULL,
    '2024-11-16 13:36:45'
  ),
  (
    96,
    261,
    1731549497693,
    'TEXT',
    'fsffsdf',
    0,
    NULL,
    '2024-11-16 13:36:50'
  ),
  (
    97,
    261,
    1731549497693,
    'TEXT',
    'sfdf',
    0,
    NULL,
    '2024-11-16 13:36:53'
  ),
  (
    98,
    261,
    1731549497693,
    'TEXT',
    'sdfdffsdf',
    0,
    NULL,
    '2024-11-16 13:37:05'
  ),
  (
    99,
    261,
    1731545186908,
    'TEXT',
    'fsdfdfdffdsff',
    0,
    NULL,
    '2024-11-16 13:37:19'
  ),
  (
    100,
    261,
    1731549496464,
    'TEXT',
    'fdfdf',
    0,
    NULL,
    '2024-11-16 13:37:22'
  ),
  (
    101,
    3,
    1731545186908,
    'TEXT',
    'sfsdf',
    0,
    NULL,
    '2024-11-16 13:37:26'
  ),
  (
    102,
    3,
    1731549497693,
    'TEXT',
    'sdfsdfsd',
    0,
    NULL,
    '2024-11-16 13:38:06'
  ),
  (
    103,
    261,
    1731594958315,
    'TEXT',
    'fffffffffffdfsdffsdfdsffff',
    0,
    NULL,
    '2024-11-16 14:05:25'
  ),
  (
    104,
    261,
    1731545186908,
    'TEXT',
    'fsdfdf',
    0,
    NULL,
    '2024-11-16 14:09:37'
  ),
  (
    105,
    261,
    1731549496464,
    'TEXT',
    'fsdfsfsdffsdfdfsdffsdf',
    0,
    NULL,
    '2024-11-16 14:17:26'
  ),
  (
    106,
    3,
    1731549497693,
    'TEXT',
    'sdfsdf',
    0,
    NULL,
    '2024-11-16 14:17:32'
  ),
  (
    107,
    261,
    1731549496464,
    'TEXT',
    'fsdfdsf',
    0,
    NULL,
    '2024-11-16 14:17:35'
  ),
  (
    108,
    3,
    1731545186908,
    'TEXT',
    'https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp',
    0,
    NULL,
    '2024-11-16 14:22:47'
  ),
  (
    109,
    3,
    1731549496464,
    'TEXT',
    'sxfsdf',
    0,
    NULL,
    '2024-11-16 14:31:41'
  ),
  (
    110,
    3,
    1731549496464,
    'TEXT',
    '<div className=\"chat chat-start\">   <div className=\"chat-image avatar\">     <div className=\"w-10 rounded-full\">       <img         alt=\"Tailwind CSS chat bubble component\"         src=\"https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp\" />     </div>   </div>   <div className=\"chat-header\">     Obi-Wan Kenobi     <time className=\"text-xs opacity-50\">12:45</time>   </div>   <div className=\"chat-bubble\">You were the Chosen One!</div>   <div className=\"chat-footer opacity-50\">Delivered</div> </div> <div className=\"chat chat-end\">   <div className=\"chat-image avatar\">     <div className=\"w-10 rounded-full\">       <img         alt=\"Tailwind CSS chat bubble component\"         src=\"https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp\" />     </div>   </div>   <div className=\"chat-header\">     Anakin     <time className=\"text-xs opacity-50\">12:46</time>   </div>   <div className=\"chat-bubble\">I hate you!</div>   <div className=\"chat-footer opacity-50\">Seen at 12:46</div> </div>',
    0,
    NULL,
    '2024-11-16 14:31:48'
  ),
  (
    111,
    3,
    1731549496464,
    'TEXT',
    '☺️☺️☺️',
    0,
    NULL,
    '2024-11-16 14:32:32'
  ),
  (
    112,
    3,
    1731549496464,
    'TEXT',
    '????',
    0,
    NULL,
    '2024-11-16 14:32:35'
  ),
  (
    113,
    3,
    1731545186908,
    'TEXT',
    'Friends Emma Johnson Emma Johnson Private Chat ????  Room_1731545186908 Group Chat https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp Emma Johnson Emma Johnson Private Chat sdfsdf Emma Johnson Emma Johnson Private Chat fffffffffffdfsdffsdfdsffff Michael Brown Michael Brown Private Chat fgfsffsdfsfd Michael Brown Michael Brown Private Chat fsdfsfdffsfsdfsdfsdfdf Michael Brown Michael Brown Private Chat Michael Brown Michael Brown Private Chat Michael Brown Michael Brown Private Chat Emma Johnson Emma Johnson Private Chat Emma Johnson Emma Johnson Private Chat Emma Johnson Emma Johnson Private Chat Emma Johnson Emma Johnson Private Chat Emma Johnson Emma Johnson Private Chat Emma Johnson Emma Johnson Private Chat Emma Johnson Emma Johnson Private Chat  Emma Johnson Private Chat Emma Johnson Emma Johnson fsdf  Today You fff  Today Emma Johnson Emma Johnson x  Today Emma Johnson Emma Johnson fsffsdf  Today Emma Johnson Emma Johnson sfdf  Today Emma Johnson Emma Johnson sdfdffsdf  Today You sdfsdfsd  Today You sdfsdf  Today ?   Type your message...',
    0,
    NULL,
    '2024-11-16 14:34:30'
  ),
  (
    114,
    3,
    1731545186908,
    'TEXT',
    'fsdf',
    0,
    NULL,
    '2024-11-16 14:36:42'
  ),
  (
    115,
    3,
    1731545186908,
    'TEXT',
    'https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp',
    0,
    NULL,
    '2024-11-16 19:34:59'
  ),
  (
    116,
    3,
    1731545186908,
    'TEXT',
    'fsdfsf',
    0,
    NULL,
    '2024-11-16 22:02:16'
  ),
  (
    117,
    3,
    1731545186908,
    'TEXT',
    'fsdf',
    0,
    NULL,
    '2024-11-16 22:03:50'
  ),
  (
    118,
    3,
    1731545186908,
    'TEXT',
    'fsfdf',
    0,
    NULL,
    '2024-11-16 22:04:04'
  ),
  (
    119,
    3,
    1731545186908,
    'TEXT',
    'fdfs',
    0,
    NULL,
    '2024-11-16 22:05:15'
  ),
  (
    120,
    3,
    1731545186908,
    'TEXT',
    'fsdff',
    0,
    NULL,
    '2024-11-16 22:06:13'
  ),
  (
    121,
    3,
    1731545186908,
    'TEXT',
    'fsdffsdffsdf',
    0,
    NULL,
    '2024-11-16 22:07:30'
  ),
  (
    122,
    3,
    1731545186908,
    'TEXT',
    'fffsdf',
    0,
    NULL,
    '2024-11-16 22:07:43'
  ),
  (
    123,
    3,
    1731545186908,
    'TEXT',
    'fsdf',
    0,
    NULL,
    '2024-11-16 22:09:17'
  ),
  (
    124,
    3,
    1731545186908,
    'TEXT',
    'fsfdf',
    0,
    NULL,
    '2024-11-16 22:09:34'
  ),
  (
    125,
    3,
    1731545186908,
    'TEXT',
    '',
    0,
    NULL,
    '2024-11-16 22:12:28'
  ),
  (
    126,
    3,
    1731545186908,
    'TEXT',
    'sf',
    0,
    NULL,
    '2024-11-16 22:12:49'
  ),
  (
    127,
    3,
    1731545186908,
    'TEXT',
    'sdfsdfsdf',
    0,
    NULL,
    '2024-11-16 22:13:31'
  ),
  (
    128,
    3,
    1731545186908,
    'TEXT',
    'fsdf',
    0,
    NULL,
    '2024-11-16 22:14:22'
  ),
  (
    129,
    3,
    1731545186908,
    'TEXT',
    '',
    0,
    NULL,
    '2024-11-16 22:15:46'
  ),
  (
    130,
    3,
    1731545186908,
    'TEXT',
    'http://localhost:8080/files/uniqcurt_uniqcurtains_com.sql http://localhost:8080/files/Screenshot 2024-11-17 021919.png http://localhost:8080/files/backup.zip http://localhost:8080/files/à¦¹à¦¤à¦¾à¦¶à¦¾à¦¯à¦¼ à¦¨à¦¿à¦°à¦¾à¦¶à¦¾à¦¯à¦¼ _ à¦®à¦¨ à¦à¦¾à¦°à¦¾à¦ªà§à¦° à¦¸à¦à§à¦à§ à¦à¦à¦²_ Hotasai nirasai Kate Amar Sara bela..mp4 http://localhost:8080/files/Apex_1723993534945.mp4 http://localhost:8080/files/Apex_1722955280941.mp4 http://localhost:8080/files/à¦à¦®à¦¾à¦° à¦¸à§à¦¨à¦¾à¦° à¦¬à¦¾à¦à¦²à¦¾ - Bangla song - James -.mp4 http://localhost:8080/files/à¦à§à¦²à§à¦®à§à¦° à¦¬à¦¿à¦°à§à¦¦à§à¦§à§.mp4 http://localhost:8080/files/uniqcurt_uniqcurtains_com.sql http://localhost:8080/files/Gojol singer abbu  2020.02.19 18.38.43.amr http://localhost:8080/files/à¦®à¦¾à¦¶à¦¾à¦²à§à¦²à¦¾à¦¹,,,à¦à¦¸à¦¾à¦§à¦¾à¦°à¦£ à¦à¦¨à§à¦ à§ à¦à¦¸à¦²à¦¾à¦®à¦¿à¦ à¦à¦à¦² 1.mp3',
    0,
    NULL,
    '2024-11-16 22:27:57'
  ),
  (
    131,
    3,
    1731545186908,
    'TEXT',
    '',
    0,
    NULL,
    '2024-11-16 22:28:14'
  ),
  (
    132,
    3,
    1731545186908,
    'TEXT',
    '',
    0,
    NULL,
    '2024-11-16 22:28:42'
  ),
  (
    133,
    3,
    1731545186908,
    'TEXT',
    '',
    0,
    NULL,
    '2024-11-16 22:28:53'
  ),
  (
    134,
    3,
    1731545186908,
    'TEXT',
    '',
    0,
    NULL,
    '2024-11-16 22:29:15'
  ),
  (
    135,
    3,
    1731545186908,
    'TEXT',
    '',
    0,
    NULL,
    '2024-11-16 22:30:09'
  ),
  (
    136,
    3,
    1731545186908,
    'TEXT',
    'http://localhost:8080/files/Screenshot 2024-11-17 021919.png',
    0,
    NULL,
    '2024-11-16 22:30:27'
  ),
  (
    137,
    3,
    1731545186908,
    'TEXT',
    'http://localhost:8080/files/julumer.mp4',
    0,
    NULL,
    '2024-11-16 22:31:07'
  ),
  (
    138,
    3,
    1731545186908,
    'TEXT',
    'http://localhost:8080/files/xx.png',
    0,
    NULL,
    '2024-11-16 22:33:11'
  ),
  (
    139,
    3,
    1731545186908,
    'TEXT',
    'http://localhost:8080/files/julumer.mp4',
    0,
    NULL,
    '2024-11-16 22:35:25'
  ),
  (
    140,
    3,
    1731545186908,
    'TEXT',
    'http://localhost:8080/files/English_Vocabulary_in_Use_Pre_Intermediate_and_Intermediate.pdf',
    0,
    NULL,
    '2024-11-16 22:37:15'
  ),
  (
    141,
    3,
    1731545186908,
    'TEXT',
    'http://localhost:8080/files/Allah, Allah Ø§ÙÙÙ Ø§ÙÙÙ  (Arabic Nasheed)  with  Eng Subs  by Ibrahim Khan (Official video )HD.mp3 http://localhost:8080/files/amar ekta mon chilo.mp3',
    0,
    NULL,
    '2024-11-16 22:37:56'
  ),
  (
    142,
    3,
    1731545186908,
    'TEXT',
    'http://localhost:8080/files/abaro_ashto_jodi.mp3 http://localhost:8080/files/Allah_Allah_U_U_U_U_.mp3',
    0,
    NULL,
    '2024-11-16 22:41:29'
  ),
  (
    143,
    3,
    1731545186908,
    'TEXT',
    'http://localhost:8080/files/Abu_ubayda3do_o_144p.mp3 http://localhost:8080/files/aj_keno_prithiba_ta_.mp3 http://localhost:8080/files/Aj_keno_prithibi_ta_.m4a http://localhost:8080/files/Allah_Allah_U_U_U_U_.mp3 http://localhost:8080/files/Allah_r_VOY_a_a_a_a_.mp3',
    0,
    NULL,
    '2024-11-16 22:43:53'
  ),
  (
    144,
    3,
    1731545186908,
    'TEXT',
    'http://localhost:8080/files/abaro_ashto_jodi.mp3 http://localhost:8080/files/Abu_ubayda3do_o_144p.mp3 http://localhost:8080/files/aj_keno_prithiba_ta_.mp3 http://localhost:8080/files/Aj_keno_prithibi_ta_.m4a http://localhost:8080/files/Allah_Allah_U_U_U_U_.mp3 http://localhost:8080/files/Allah_r_VOY_a_a_a_a_.mp3 http://localhost:8080/files/Allahu_Allahu_Allahu.mp3 http://localhost:8080/files/amar_ekta_mon_chilo.mp3 http://localhost:8080/files/amar_a_a_a_a_a_a_a_a.mp3 http://localhost:8080/files/ami_shopno_hobo_a_a_.mp3 http://localhost:8080/files/amr_mon_mojaiya_re.mp3 http://localhost:8080/files/apon_tumi_jader_sara.mp3 http://localhost:8080/files/Bangla_Islamic_gojol.mp3',
    0,
    NULL,
    '2024-11-16 22:47:17'
  ),
  (
    145,
    3,
    1731549497693,
    'TEXT',
    'http://localhost:8080/files/15893269_016_c59d.jpg',
    0,
    NULL,
    '2024-11-16 23:05:00'
  ),
  (
    146,
    3,
    1731549497693,
    'TEXT',
    'http://localhost:8080/files/15893269_016_c59d.jpg',
    0,
    NULL,
    '2024-11-16 23:05:06'
  ),
  (
    147,
    3,
    1731549497693,
    'TEXT',
    'http://localhost:8080/files/15893269_016_c59d.jpg',
    0,
    NULL,
    '2024-11-16 23:05:35'
  ),
  (
    148,
    3,
    1731545186908,
    'TEXT',
    'fsdfsf',
    0,
    NULL,
    '2024-11-17 13:16:03'
  ),
  (
    149,
    5,
    1731545186908,
    'TEXT',
    'sdfsdssssssssssssssddddddddd',
    0,
    NULL,
    '2024-11-17 13:19:59'
  ),
  (
    150,
    3,
    1731545186908,
    'TEXT',
    'hello',
    0,
    NULL,
    '2024-11-17 13:26:36'
  ),
  (
    151,
    3,
    1731545186908,
    'TEXT',
    'nice',
    0,
    NULL,
    '2024-11-17 13:26:41'
  ),
  (
    152,
    261,
    1731545186908,
    'TEXT',
    'https://x.com',
    0,
    NULL,
    '2024-11-17 13:26:51'
  ),
  (
    153,
    261,
    1731545186908,
    'TEXT',
    'this is a imagehttps://cef5083641cc45de40177002a9aebf09.serveo.net/files/360_F_432030947_wiKp.webp',
    0,
    NULL,
    '2024-11-17 13:27:23'
  ),
  (
    154,
    261,
    1731545186908,
    'TEXT',
    'https://cef5083641cc45de40177002a9aebf09.serveo.net/files/463434075_1221260921.jpg',
    0,
    NULL,
    '2024-11-17 13:27:48'
  ),
  (
    155,
    261,
    1731545186908,
    'TEXT',
    'https://cef5083641cc45de40177002a9aebf09.serveo.net/files/Study_Planner_6842.pptx',
    0,
    NULL,
    '2024-11-17 13:29:05'
  ),
  (
    156,
    261,
    1731594958315,
    'TEXT',
    'hello rohan',
    0,
    NULL,
    '2024-11-17 13:29:51'
  ),
  (
    157,
    261,
    1731594958315,
    'TEXT',
    '?????',
    0,
    NULL,
    '2024-11-17 13:30:05'
  ),
  (
    158,
    3,
    1731545186908,
    'TEXT',
    'Fffvggfgfcgvccccjsjkccff',
    0,
    NULL,
    '2024-11-17 13:45:16'
  ),
  (
    159,
    261,
    1731545186908,
    'TEXT',
    'hello daa',
    0,
    NULL,
    '2024-11-17 13:54:16'
  ),
  (
    160,
    5,
    1731545186908,
    'TEXT',
    'show kore ki ',
    0,
    NULL,
    '2024-11-17 13:54:45'
  ),
  (
    161,
    5,
    1731545186908,
    'TEXT',
    'typeing indicatory',
    0,
    NULL,
    '2024-11-17 13:54:51'
  ),
  (
    162,
    5,
    1731545186908,
    'TEXT',
    '???',
    0,
    NULL,
    '2024-11-17 13:55:08'
  ),
  (
    163,
    3,
    1731545186908,
    'TEXT',
    'hello',
    0,
    NULL,
    '2024-11-17 13:55:19'
  ),
  (
    164,
    5,
    1731545186908,
    'TEXT',
    'typing indicator kaj kore?',
    0,
    NULL,
    '2024-11-17 13:55:33'
  ),
  (
    165,
    5,
    1731545186908,
    'TEXT',
    'toamr oikhane?',
    0,
    NULL,
    '2024-11-17 13:55:37'
  ),
  (
    166,
    5,
    1731545186908,
    'TEXT',
    'https://cef5083641cc45de40177002a9aebf09.serveo.net/files/Screenshot_2024_11_1.png',
    0,
    NULL,
    '2024-11-17 13:56:03'
  ),
  (
    167,
    5,
    1731545186908,
    'TEXT',
    'emon?\"',
    0,
    NULL,
    '2024-11-17 13:56:10'
  ),
  (
    168,
    261,
    1731545186908,
    'TEXT',
    'kothay gele go dada',
    0,
    NULL,
    '2024-11-17 13:56:28'
  ),
  (
    169,
    5,
    1731545186908,
    'TEXT',
    'https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp',
    0,
    NULL,
    '2024-11-17 13:57:13'
  ),
  (
    170,
    261,
    1731545186908,
    'TEXT',
    'https://cef5083641cc45de40177002a9aebf09.serveo.net/files/Screenshot_2024_06_0.png',
    0,
    NULL,
    '2024-11-17 13:58:44'
  ),
  (
    171,
    5,
    1731545186908,
    'TEXT',
    'https://cef5083641cc45de40177002a9aebf09.serveo.net/files/Screenshot_2024_06_0.png',
    0,
    NULL,
    '2024-11-17 13:58:59'
  ),
  (
    172,
    261,
    1731545186908,
    'TEXT',
    'fsfsdf',
    0,
    NULL,
    '2024-11-17 14:02:47'
  ),
  (
    173,
    261,
    1731549497693,
    'TEXT',
    'fsdffsdfsfsd',
    0,
    NULL,
    '2024-11-17 14:09:22'
  ),
  (
    174,
    261,
    1731545186908,
    'TEXT',
    'sdfsdf',
    0,
    NULL,
    '2024-11-17 14:10:02'
  ),
  (
    175,
    261,
    1731545186908,
    'TEXT',
    'fsdfff',
    0,
    NULL,
    '2024-11-17 14:15:22'
  ),
  (
    176,
    3,
    1731545186908,
    'TEXT',
    'ffsdsdfsdfsfs',
    0,
    NULL,
    '2024-11-17 14:29:44'
  ),
  (
    177,
    3,
    1731545186908,
    'TEXT',
    'fsdfsf',
    0,
    NULL,
    '2024-11-17 14:30:46'
  ),
  (
    178,
    3,
    1731545186908,
    'TEXT',
    'fsdf',
    0,
    NULL,
    '2024-11-17 14:31:03'
  ),
  (
    179,
    3,
    1731545186908,
    'TEXT',
    'fsdf',
    0,
    NULL,
    '2024-11-17 14:31:21'
  ),
  (
    180,
    3,
    1731545186908,
    'TEXT',
    'fsdf',
    0,
    NULL,
    '2024-11-17 14:32:51'
  ),
  (
    181,
    3,
    1731545186908,
    'TEXT',
    'fsdf',
    0,
    NULL,
    '2024-11-17 14:33:20'
  ),
  (
    182,
    3,
    1731545186908,
    'TEXT',
    'fsdfsdf',
    0,
    NULL,
    '2024-11-17 14:33:23'
  ),
  (
    183,
    3,
    1731545186908,
    'TEXT',
    'sfsdf',
    0,
    NULL,
    '2024-11-17 14:33:38'
  ),
  (
    184,
    3,
    1731545186908,
    'TEXT',
    'sdfsdf',
    0,
    NULL,
    '2024-11-17 14:34:04'
  ),
  (
    185,
    3,
    1731545186908,
    'TEXT',
    'fsdfsdffdfdfs',
    0,
    NULL,
    '2024-11-17 14:34:13'
  ),
  (
    186,
    3,
    1731545186908,
    'TEXT',
    'fsdfsdf',
    0,
    NULL,
    '2024-11-17 14:36:42'
  ),
  (
    187,
    3,
    1731545186908,
    'TEXT',
    'fsdfsdfffsdf',
    0,
    NULL,
    '2024-11-17 14:36:49'
  ),
  (
    188,
    3,
    1731545186908,
    'TEXT',
    'sdfsdf',
    0,
    NULL,
    '2024-11-17 14:42:14'
  ),
  (
    189,
    3,
    1731545186908,
    'TEXT',
    'xxx',
    0,
    NULL,
    '2024-11-17 14:42:17'
  ),
  (
    190,
    3,
    1731545186908,
    'TEXT',
    'sdfsdf',
    0,
    NULL,
    '2024-11-17 14:45:36'
  ),
  (
    191,
    3,
    1731545186908,
    'TEXT',
    'x',
    0,
    NULL,
    '2024-11-17 14:45:41'
  ),
  (
    192,
    3,
    1731545186908,
    'TEXT',
    'xfsdfdf',
    0,
    NULL,
    '2024-11-17 14:45:47'
  ),
  (
    193,
    3,
    1731545186908,
    'TEXT',
    'fsdffsd',
    0,
    NULL,
    '2024-11-17 14:45:59'
  ),
  (
    194,
    3,
    1731545186908,
    'TEXT',
    'fsdfsdfdf',
    0,
    NULL,
    '2024-11-17 14:46:06'
  ),
  (
    195,
    3,
    1731545186908,
    'TEXT',
    'xxxxxxxxxxx',
    0,
    NULL,
    '2024-11-17 14:46:10'
  ),
  (
    196,
    3,
    1731545186908,
    'TEXT',
    'fsdfsdfs',
    0,
    NULL,
    '2024-11-17 14:46:33'
  ),
  (
    197,
    3,
    1731594958315,
    'TEXT',
    'fsdffsdf',
    0,
    NULL,
    '2024-11-17 14:46:53'
  ),
  (
    198,
    3,
    1731594958315,
    'TEXT',
    'fsdfs',
    0,
    NULL,
    '2024-11-17 14:47:30'
  ),
  (
    199,
    3,
    1731594958315,
    'TEXT',
    'fsddff',
    0,
    NULL,
    '2024-11-17 14:47:56'
  ),
  (
    200,
    3,
    1731594958315,
    'TEXT',
    'fsdf',
    0,
    NULL,
    '2024-11-17 14:48:03'
  ),
  (
    201,
    3,
    1731594958315,
    'TEXT',
    'fsdf',
    0,
    NULL,
    '2024-11-17 15:17:16'
  ),
  (
    202,
    3,
    1731549497693,
    'TEXT',
    'dfsdf',
    0,
    NULL,
    '2024-11-17 15:18:33'
  ),
  (
    203,
    3,
    1731545186908,
    'TEXT',
    'fsdf http://localhost:8080/files/Screenshot_2024_08_2.png http://localhost:8080/files/xx.png http://localhost:8080/files/backup.zip http://localhost:8080/files/a_a_a_a_a_a_a_a_a_a_.mp4 http://localhost:8080/files/Apex_1723993534945.mp4 http://localhost:8080/files/Apex_1722955280941.mp4 http://localhost:8080/files/a_a_a_a_a_a_a_a_a_a_.mp4 http://localhost:8080/files/julumer.mp4 http://localhost:8080/files/uniqcurt_uniqcurtain.sql http://localhost:8080/files/Gojol_singer_abbu_20.amr http://localhost:8080/files/a_a_a_a_a_a_a_a_a_a_.mp3',
    0,
    NULL,
    '2024-11-18 15:23:16'
  ),
  (
    204,
    3,
    1731545186908,
    'TEXT',
    ' http://localhost:8080/files/Screenshot_2024_08_2.png',
    0,
    NULL,
    '2024-11-18 15:24:52'
  ),
  (
    205,
    3,
    1731545186908,
    'TEXT',
    'http://localhost:8080/files/Screenshot_2024_08_2.png',
    0,
    NULL,
    '2024-11-18 15:24:55'
  ),
  (
    206,
    3,
    1731545186908,
    'TEXT',
    ' http://localhost:8080/files/Screenshot_2024_06_3.png http://localhost:8080/files/Screenshot_2024_06_3.png http://localhost:8080/files/Screenshot_2024_06_3.png http://localhost:8080/files/Screenshot_2024_06_3.png',
    0,
    NULL,
    '2024-11-18 15:25:21'
  ),
  (
    207,
    3,
    1731545186908,
    'TEXT',
    'http://localhost:8080/files/Screenshot_2024_06_3.png',
    0,
    NULL,
    '2024-11-18 15:25:28'
  ),
  (
    208,
    3,
    1731545186908,
    'TEXT',
    ' http://localhost:8080/files/md2pdf_Markdown_to_P.pdf',
    0,
    NULL,
    '2024-11-18 15:26:37'
  ),
  (
    209,
    3,
    1731545186908,
    'TEXT',
    'http://localhost:8080/files/Screenshot_2024_06_3.png',
    0,
    NULL,
    '2024-11-24 13:32:07'
  ),
  (
    210,
    3,
    1731546935266,
    'TEXT',
    'dsas',
    0,
    NULL,
    '2024-11-24 14:42:47'
  ),
  (
    211,
    3,
    1731545222919,
    'TEXT',
    'fsdfsdfs',
    0,
    NULL,
    '2024-11-24 14:42:50'
  ),
  (
    212,
    3,
    1731545186908,
    'TEXT',
    'sdfd',
    0,
    NULL,
    '2024-11-25 10:56:05'
  ),
  (
    213,
    3,
    1731545186908,
    'TEXT',
    'https://www.youtube.com/watch?v=sXFdOcclJMk&list=RDMMJ--wlSyNSuU&index=8',
    0,
    NULL,
    '2024-11-25 10:56:21'
  ),
  (
    214,
    3,
    1731545186908,
    'TEXT',
    'https://drive.google.com/drive/folders/12FtQ_w_gu2TtB6cRDNnF64WPNC_HxuX1',
    0,
    NULL,
    '2024-11-25 10:56:34'
  ),
  (
    215,
    3,
    1731545186908,
    'TEXT',
    'sdfffs',
    0,
    NULL,
    '2024-11-25 10:57:12'
  ),
  (
    216,
    3,
    1731545186908,
    'TEXT',
    'https://hono.dev/docs/concepts/motivation',
    0,
    NULL,
    '2024-11-25 10:57:23'
  ),
  (
    217,
    3,
    1731545186908,
    'TEXT',
    'Here’s a TypeScript implementation for the hooks and utilities described earlier for your **Database Query Builder** package. I\'ll provide the code structure and a few essential functions that can be used within a React app or a Node.js backend.   ### **1. Database Query Builder Package: TypeScript Code Implementation**  #### **Hooks Implementation**  1. **`useQuery` Hook** - Fetches data with a `SELECT` query.    ```typescript    import { useState, useEffect } from \'react\';     export function useQuery(query: string, params: any[] = []) {      const [data, setData] = useState<any[]>([]);      const [loading, setLoading] = useState<boolean>(true);      const [error, setError] = useState<string | null>(null);       useEffect(() => {        const fetchData = async () => {          try {            // Assuming a function `executeQuery` exists to run the SQL            const result = await executeQuery(query, params);            setData(result);          } catch (err) {            setError(\'Failed to fetch data\');          } finally {            setLoading(false);          }        };        fetchData();      }, [query, params]);       return { data, loading, error };    }     async function executeQuery(query: string, params: any[]) {      // Replace this with your actual query execution logic      console.log(\'Executing query:\', query, params);      return [];  // Placeholder for real query results    }    ```  2. **`useInsert` Hook** - Handles inserting data into the database.    ```typescript    import { useState } from \'react\';     export function useInsert() {      const [isInserting, setIsInserting] = useState(false);      const [insertError, setInsertError] = useState<string | null>(null);       const insertData = async (data: Record<string, any>) => {        setIsInserting(true);        try {          // Insert logic here          await executeInsertQuery(\'INSERT INTO users SET ?\', [data]);        } catch (err) {          setInsertError(\'Insert failed\');        } finally {          setIsInserting(false);        }      };       return { insertData, isInserting, insertError };    }     async function executeInsertQuery(query: string, params: any[]) {      // Placeholder for insert logic      console.log(\'Inserting data:\', query, params);    }    ```  3. **`useUpdate` Hook** - Handles updating records in the database.    ```typescript    import { useState } from \'react\';     export function useUpdate() {      const [isUpdating, setIsUpdating] = useState(false);      const [updateError, setUpdateError] = useState<string | null>(null);       const updateData = async (data: Record<string, any>, id: number) => {        setIsUpdating(true);        try {          await executeUpdateQuery(\'UPDATE users SET ? WHERE id = ?\', [data, id]);        } catch (err) {          setUpdateError(\'Update failed\');        } finally {          setIsUpdating(false);        }      };       return { updateData, isUpdating, updateError };    }     async function executeUpdateQuery(query: string, params: any[]) {      // Placeholder for update logic      console.log(\'Updating data:\', query, params);    }    ```  4. **`useDelete` Hook** - Handles deleting records in the database.    ```typescript    import { useState } from \'react\';     export function useDelete() {      const [isDeleting, setIsDeleting] = useState(false);      const [deleteError, setDeleteError] = useState<string | null>(null);       const deleteData = async (id: number) => {        setIsDeleting(true);        try {          await executeDeleteQuery(\'DELETE FROM users WHERE id = ?\', [id]);        } catch (err) {          setDeleteError(\'Delete failed\');        } finally {          setIsDeleting(false);        }      };       return { deleteData, isDeleting, deleteError };    }     async function executeDeleteQuery(query: string, params: any[]) {      // Placeholder for delete logic      console.log(\'Deleting data:\', query, params);    }    ```  #### **Utility Functions**  5. **`buildWhereClause`** - Dynamically builds a `WHERE` clause.    ```typescript    export function buildWhereClause(conditions: Record<string, any>) {      const clauses = Object.entries(conditions).map(([key, value]) => {        return `${key} = ?`;  // Placeholder for more complex conditions      });      return clauses.join(\' AND \');    }    ```  6. **`buildJoinClause`** - Builds SQL `JOIN` clauses.    ```typescript    export function buildJoinClause(joinType: string, fromTable: string, toTable: string, onClause: string) {      return `${joinType} ${toTable} ON ${onClause}`;    }    ```  7. **`buildSortClause`** - Builds `ORDER BY` clauses for sorting.    ```typescript    export function buildSortClause(column: string, direction: \'ASC\' | \'DESC\') {      return `ORDER BY ${column} ${direction}`;    }    ```  8. **`executeQuery`** - Executes a raw SQL query.    ```typescript    export async function executeQuery(query: string, params: any[]) {      // Database logic here to execute the SQL query      console.log(\'Executing query:\', query, params);      return [];  // Placeholder for query results    }    ```  9. **`escapeSQL`** - Escapes user input to prevent SQL injection.    ```typescript    export function escapeSQL(value: string): string {      return value.replace(/\'/g, \"\'\'\");  // Simple SQL escaping    }    ```  10. **`logQuery`** - Logs SQL queries for debugging purposes.     ```typescript     export function logQuery(query: string, params: any[]) {       console.log(`SQL Query: ${query}, Params: ${JSON.stringify(params)}`);     }     ```  ---  ### **Usage Example in React App**  ```typescript import React from \'react\'; import { useQuery } from \'./hooks/useQuery\'; import { useInsert } from \'./hooks/useInsert\';  const App = () => {   const { data, loading, error } = useQuery(\'SELECT * FROM users WHERE age > ?\', [30]);   const { insertData, isInserting, insertError } = useInsert();    const handleInsert = () => {     insertData({ name: \'John Doe\', age: 28 });   };    return (     <div>       <h1>User List</h1>       {loading && <p>Loading...</p>}       {error && <p>Error: {error}</p>}       <ul>         {data.map((user: any) => (           <li key={user.id}>{user.name}</li>         ))}       </ul>       <button onClick={handleInsert} disabled={isInserting}>         Insert New User       </button>     </div>   ); };  export default App; ```  ---  ### **Conclusion** This setup offers a solid foundation for your **Database Query Builder** package in TypeScript. The provided hooks handle common database operations like fetching, inserting, updating, and deleting data, while utility functions assist in building SQL queries dynamically. With the `useQuery`, `useInsert`, `useUpdate`, and `useDelete` hooks, your package will have powerful capabilities for interacting with a SQL database in a type-safe and organized manner.',
    0,
    NULL,
    '2024-11-25 10:57:35'
  ),
  (
    218,
    5,
    1731545222919,
    'TEXT',
    'sdfsdfsdsdfsdfsdfsdfsdfsdfsdfsdff',
    0,
    NULL,
    '2024-11-25 10:57:49'
  ),
  (
    219,
    5,
    1731545222919,
    'TEXT',
    'Friends  Room_1731545186908 Group Chat https://drive.google.com/drive/folders/12FtQ_w_gu2TtB6cRDNnF64WPNC_HxuX1 Alice Smith Alice Smith Private Chat fsdfsdfs Alice Smith Alice Smith Private Chat dsas Alice Smith Alice Smith Private Chat Alice Smith Alice Smith Private Chat Alice Smith Alice Smith Private Chat  Alice Smith Private Chat Alice Smith Alice Smith fsdf  Nov 16, 2024 Alice Smith Alice Smith x.com  Nov 16, 2024 Alice Smith Alice Smith http://x.com  Nov 16, 2024 You Message Image  Nov 16, 2024 Alice Smith Alice Smith xxxxxxxxx  Nov 16, 2024 You xxxxxx  Nov 16, 2024 You [ { \"type\": \"pdf\", \"url\": \" https://www.nist.gov/document/cybersecurity-framework-pdf \" }, { \"type\": \"pdf\", \"url\": \" Download PDF \" }, { \"type\": \"doc\", \"url\": \" Download Document \" }, { \"type\": \"xlsx\", \"url\": \" Download Excel \" }, { \"type\": \"xlsx\", \"url\": \" Download Excel \" }, { \"type\": \"mp4\", \"url\": \" https://video.nationalgeographic.com/video/00000144-0a24-d3cb-a96c-7b2fe1450000 \" }, { \"type\": \"mp4\", \"url\": \" \" }, { \"type\": \"mp3\", \"url\": \" \" }, { \"type\": \"audio\", \"url\": \" \" }, { \"type\": \"video\", \"url\": \" \" }, { \"type\": \"docx\", \"url\": \" Download Document \" }, { \"type\": \"ppt\", \"url\": \" Download Presentation \" }, { \"type\": \"pptx\", \"url\": \" Download Presentation \" }, { \"type\": \"pdf\", \"url\": \" Download PDF \" }, { \"type\": \"xlsx\", \"url\": \" https://www.fda.gov/media/124638/download \" }, { \"type\": \"xls\", \"url\": \" Download Excel \" }, { \"type\": \"video\", \"url\": \" \" }, { \"type\": \"pdf\", \"url\": \" Download PDF \" }, { \"type\": \"pdf\", \"url\": \" Download PDF \" }, { \"type\": \"image\", \"url\": \" Message Image \" }, { \"type\": \"image\", \"url\": \" Message Image \" }, { \"type\": \"image\", \"url\": \" https://images.unsplash.com/photo-1542089363-c3bd38516e4b \" }, { \"type\": \"image\", \"url\": \" Message Image \" }, { \"type\": \"pdf\", \"url\": \" Download PDF \" }, { \"type\": \"pdf\", \"url\": \" Download PDF \" }, { \"type\": \"docx\", \"url\": \" Download Document \" }, { \"type\": \"audio\", \"url\": \" \" }, { \"type\": \"xls\", \"url\": \" Download File \" }, { \"type\": \"audio\", \"url\": \" \" }, { \"type\": \"pdf\", \"url\": \" Download PDF \" }, { \"type\": \"video\", \"url\": \" \" }, { \"type\": \"pdf\", \"url\": \" https://unesdoc.unesco.org/ark:/48223/pf0000233321 \" }, { \"type\": \"image\", \"url\": \" Message Image \" }, { \"type\": \"audio\", \"url\": \" \" }, { \"type\": \"audio\", \"url\": \" \" }, { \"type\": \"xlsx\", \"url\": \" Download Excel \" }, { \"type\": \"pdf\", \"url\": \" https://dumps.wikimedia.org/other/static_html_dumps/current_en.wikipedia.org.tar.gz \" }, { \"type\": \"pdf\", \"url\": \" Download PDF \" }, { \"type\": \"audio\", \"url\": \" \" }, { \"type\": \"pdf\", \"url\": \" Download PDF \" }, { \"type\": \"doc\", \"url\": \" https://calhoun.nps.edu/bitstream/handle/10945/39080/doc1.doc?sequence=1 \" }, { \"type\": \"mp4\", \"url\": \" \" }, { \"type\": \"video\", \"url\": \" \" }, { \"type\": \"xls\", \"url\": \" Download Excel \" }, { \"type\": \"ppt\", \"url\": \" https://www.eff.org/document/case-study-powerpoint-presentation \" }, { \"type\": \"pdf\", \"url\": \" Download PDF \" }, { \"type\": \"docx\", \"url\": \" Download Document \" } ]  Nov 16, 2024 You hello kiba acho  Nov 16, 2024 Alice Smith Alice Smith ami valo achi  Nov 16, 2024 Alice Smith Alice Smith tumi kibe acho  Nov 16, 2024 Alice Smith Alice Smith Message Image  Nov 16, 2024 Alice Smith Alice Smith Skip to main contentTurn off continuous scrolling Accessibility help Accessibility feedback freepik Logo Template Poster Flower Wallpaper Free vector Pattern Eid mubarak Floral Wedding invitation Menu Clipart Mockup Fashion Happy Texture Restaurant Mobile Digital marketing Music Gold Student Instagram Raksha bandhan Vintage Gradient Freepik company Abstract background Freepik contributor Freepik subscription Banner Business App Freepik Facebook Freepik Freepik | Create great designs, faster www.freepik.com Freepik | Create great designs, faster About us | Freepik Freepik About us | Freepik Sell Photos, Vectors and PSD and make ... Freepik Sell Photos, Vectors and PSD and make ... Freepik: a contributor review | Xpiks Blog Xpiks Freepik: a contributor review | Xpiks Blog Freepik: Design & edit with AI - Apps ... Google Play Freepik: Design & edit with AI - Apps ... Freepik review (2024): Pros, cons ... Photutorial Freepik review (2024): Pros, cons ... Abstract Wallpaper Websites Images ... Freepik Abstract Wallpaper Websites Images ... Style Creative Background Vectors & ... Freepik Style Creative Background Vectors & ... Creativity Images - Free Download on ... Freepik Creativity Images - Free Download on ... Fond Design Vectors & Illustrations for ... Freepik Fond Design Vectors & Illustrations for ... Freepik Yearly Subscription - Mamun Academy Mamun Academy · In stock Freepik Yearly Subscription - Mamun Academy Free Vectors to Download | Freepik Freepik Free Vectors to Download | Freepik Freepik License & Terms Of Use (2024 Guide) Photutorial Freepik License & Terms Of Use (2024 Guide) Banner Vectors & Illustrations for Free ... Freepik Banner Vectors & Illustrations for Free ... Freepik EQT Freepik Page 34 | Outline Logo Green Images ... Freepik Page 34 | Outline Logo Green Images ... Page 3 | Vibrant Background Vectors ... Freepik Page 3 | Vibrant Background Vectors ... How to Download Higher Resolution Image ... YouTube How to Download Higher Resolution Image ... Digital Vectors & Illustrations for ... Freepik Digital Vectors & Illustrations for ... Sell Photos, Vectors and PSD and make ... Freepik Sell Photos, Vectors and PSD and make ... Work Images - Free Download on Freepik Freepik Work Images - Free Download on Freepik freepik Logo PNG Vector SVG, EPS, Ai ... CDNLogo freepik Logo PNG Vector SVG, EPS, Ai ... Page 18 | Cool Free Backgrounds Vectors ... Freepik Page 18 | Cool Free Backgrounds Vectors ... Related searches freepik girl background poster design freepik Page 85 | Designer Images - Free ... Freepik Page 85 | Designer Images - Free ... Page 23 | Fondos De Back Ground Images ... Freepik Page 23 | Fondos De Back Ground Images ... Page 77 | Design Background Images ... Freepik Page 77 | Design Background Images ... Business infographic flat design with ... Freepik Business infographic flat design with ... Thoughts on the Freepik new logo? : r ... Reddit Thoughts on the Freepik new logo? : r ... Freepik Photos, Images & Pictures ... Shutterstock Freepik Photos, Images & Pictures ... Free icons designed by Freepik | Flaticon Flaticon Free icons designed by Freepik | Flaticon Poster Images - Free Download on Freepik Freepik Poster Images - Free Download on Freepik Freepik Rebrands To Champion Creativity ... Haldoor Academy Freepik Rebrands To Champion Creativity ... February, the month of love? At Freepik ... LinkedIn February, the month of love? At Freepik ... Page 24 | Facebook Twitter Logo Vectors ... Freepik Page 24 | Facebook Twitter Logo Vectors ... Premium Vector | Freepik design Freepik Premium Vector | Freepik design Free Vectors to Download | Freepik Freepik Free Vectors to Download | Freepik People Images - Free Download on Freepik Freepik People Images - Free Download on Freepik Freepik in 2024 - Reviews, Features ... PAT Research Freepik in 2024 - Reviews, Features ... Offer Images - Free Download on Freepik Freepik Offer Images - Free Download on Freepik Page 93 | Background Images - Free ... Freepik Page 93 | Background Images - Free ... FREEPIK EDITOR TUTORIAL | EDIT DESIGN ... YouTube FREEPIK EDITOR TUTORIAL | EDIT DESIGN ... Book Images - Free Download on Freepik Freepik Book Images - Free Download on Freepik Page 16 | Graphics Download Images ... Freepik Page 16 | Graphics Download Images ... Infographic Images - Free Download on ... Freepik Infographic Images - Free Download on ... How to download Freepik images ... Freepik Support ? Freepik Support How to download Freepik images ... Business Flyer Vectors & Illustrations ... Freepik Business Flyer Vectors & Illustrations ... Company Images - Free Download on Freepik Freepik Company Images - Free Download on Freepik Related searches freepik pictures freepik images free download wallpaper freepik Freepik Reviews | Read Customer Service ... Trustpilot Freepik Reviews | Read Customer Service ... Shapes Images - Free Download on Freepik Freepik Shapes Images - Free Download on Freepik Business Management Images - Free ... Freepik Business Management Images - Free ... Freepik (freepik) - Profile | Pinterest Pinterest Freepik (freepik) - Profile | Pinterest Freepik - Download this vector: https ... Facebook Freepik - Download this vector: https ... Freepik Group Buy at 499 Taka For 30 ... SEO TOOL BD Freepik Group Buy at 499 Taka For 30 ... About Us Images - Free Download on Freepik Freepik About Us Images - Free Download on Freepik Login Images - Free Download on Freepik Freepik Login Images - Free Download on Freepik Technology Images - Free Download on ... Freepik Technology Images - Free Download on ... Is freepik.com down or not working ... Uptime.com Is freepik.com down or not working ... Graphics Vectors & Illustrations for ... Freepik Graphics Vectors & Illustrations for ... Abstract Pictures | Freepik Freepik Abstract Pictures | Freepik Family Images - Free Download on Freepik Freepik Family Images - Free Download on Freepik Freepik Background Hd Vectors ... Freepik Freepik Background Hd Vectors ... Water Design Images - Free Download on ... Freepik Water Design Images - Free Download on ... Page 33 | Background Concept Vectors ... Freepik Page 33 | Background Concept Vectors ... Freepik Upload Vectors & Illustrations ... Freepik Freepik Upload Vectors & Illustrations ... Free icons designed by Freepik | Flaticon Flaticon Free icons designed by Freepik | Flaticon Page 59 | Forma De Fondo Images - Free ... Freepik Page 59 | Forma De Fondo Images - Free ... Freepik png images | PNGEgg PNGEgg Freepik png images | PNGEgg Travel Images - Free Download on Freepik Freepik Travel Images - Free Download on Freepik Website Design Background Images ... Freepik Website Design Background Images ... Brochure Images - Free Download on Freepik Freepik Brochure Images - Free Download on Freepik Design Images - Free Download on Freepik Freepik Design Images - Free Download on Freepik Related searches freepik logo freepik design freepik images Free Vector | Landing page template for ... Freepik Free Vector | Landing page template for ... Location Images - Free Download on Freepik Freepik Location Images - Free Download on Freepik Freepik review (2024): Pros, cons ... Photutorial Freepik review (2024): Pros, cons ... Blue Background Vectors & Illustrations ... Freepik Blue Background Vectors & Illustrations ... freepik tutorial in hindi | freepik ... YouTube freepik tutorial in hindi | freepik ... Education Images - Free Download on Freepik Freepik Education Images - Free Download on Freepik img.freepik.com/free-vector/flat-nature-landing-pa... www.freepik.com img.freepik.com/free-vector/flat-nature-landing-pa... Freepik | Create great designs, faster Pinterest Freepik | Create great designs, faster Freepik PNG Transparent Images Free ... Pngtree Freepik PNG Transparent Images Free ... Freepik Image Free Downloader | Freepik ... Codify Formatter Freepik Image Free Downloader | Freepik ... Freepik Stock Illustrations – 961 ... Dreamstime.com Freepik Stock Illustrations – 961 ... Starline Author Portfolio | Freepik Freepik Starline Author Portfolio | Freepik Page 81 | Digital Net Images - Free ... Freepik Page 81 | Digital Net Images - Free ... Freepik - Freepik Premium for life? It ... Facebook Freepik - Freepik Premium for life? It ... How to Download Premium Images for Free ... YouTube How to Download Premium Images for Free ... Flat geometric background | Premium AI ... Freepik Flat geometric background | Premium AI ... Freepik logo PNG, vector file in (SVG ... Pinterest Freepik logo PNG, vector file in (SVG ... Flyer Design Images - Free Download on ... Freepik Flyer Design Images - Free Download on ... EQT acquires freemium graphics and ... TechCrunch EQT acquires freemium graphics and ... Freepik: Design & edit with AI on the ... App Store - Apple Freepik: Design & edit with AI on the ... Get FreePik Premium Yearly – Premium At ... Premium At Cheap Get FreePik Premium Yearly – Premium At ... Freepik Premium Subscription - Marts BD Marts BD Freepik Premium Subscription - Marts BD FreePik Premium -KeySewa.Com KeySewa FreePik Premium -KeySewa.Com Freepik PNG Transparent Images Free ... Pngtree Freepik PNG Transparent Images Free ... Related searches freepik background flower freepik pattern freepik More results Freepik Page 25 | Abstract Wallpaper Websites Images - Free Download on Freepik Page 25 | Abstract Wallpaper Websites Images - Free Download on Freepik Images may be subject to copyright. Learn More Abstarct Background Images - Free Download on Freepik Freepik Abstarct Background Images - Free Download on Freepik Blue Background Design Vectors & Illustrations for Free Download | Freepik Freepik Blue Background Design Vectors & Illustrations for Free Download | Freepik Premium Vector | Modern dark blue abstract background paper shine and layer element vector for presentation design Suit for business corporate institution party festive seminar and talks Freepik Premium Vector | Modern dark blue abstract background paper shine and layer element vector for presentation design Suit for business corporate institution party festive seminar and talks Modern black and blue abstract background with a minimalistic design | Premium AI-generated image Freepik Modern black and blue abstract background with a minimalistic design | Premium AI-generated image Premium Vector | Background Images Free Download on Freepik Freepik Premium Vector | Background Images Free Download on Freepik Premium Vector | Blue abstract background Freepik Premium Vector | Blue abstract background Page 5 | Simple Abstract Background Images - Free Download on Freepik Freepik Page 5 | Simple Abstract Background Images - Free Download on Freepik Page 4 | Navy White Background Images - Free Download on Freepik Freepik Page 4 | Navy White Background Images - Free Download on Freepik Background Blue Images - Free Download on Freepik Freepik Background Blue Images - Free Download on Freepik Free Vector | Abstract wavy futuristic background Freepik Free Vector | Abstract wavy futuristic background Page 8 | Blue L Images - Free Download on Freepik Freepik Page 8 | Blue L Images - Free Download on Freepik Background Blue Images - Free Download on Freepik Freepik Background Blue Images - Free Download on Freepik See more Related searches abstract blue and purple background freepik background blue wave vector png freepik design Send feedback Get help Saved  Nov 16, 2024 Alice Smith Alice Smith Message Image  Nov 16, 2024 Alice Smith Alice Smith dsfs  Nov 16, 2024 Alice Smith Alice Smith fsdf  Nov 16, 2024 Alice Smith Alice Smith fsdfsfdffsfsdfsdfsdfdf  Nov 16, 2024 Alice Smith Alice Smith fsdfsdfs  Yesterday You sdfsdfsdsdfsdfsdfsdfsdfsdfsdfsdff  Today ?   Type your message...',
    0,
    NULL,
    '2024-11-25 10:57:57'
  );

/*!40000 ALTER TABLE `messages` ENABLE KEYS */;

UNLOCK TABLES;

--
-- Table structure for table `users`
--
DROP TABLE IF EXISTS `users`;

/*!40101 SET @saved_cs_client     = @@character_set_client */;

/*!50503 SET character_set_client = utf8mb4 */;

CREATE TABLE
  `users` (
    `user_id` bigint NOT NULL AUTO_INCREMENT,
    `username` varchar(50) NOT NULL,
    `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    PRIMARY KEY (`user_id`),
    UNIQUE KEY `username` (`username`),
    UNIQUE KEY `email` (`email`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 370 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--
LOCK TABLES `users` WRITE;

/*!40000 ALTER TABLE `users` DISABLE KEYS */;

INSERT INTO
  `users`
VALUES
  (
    1,
    'data?.username',
    NULL,
    NULL,
    'https://ui-avatars.com/api/?name=John+Doe&background=random',
    '2024-11-13 23:11:28',
    '2024-11-14 12:42:40',
    'John Doe'
  ),
  (
    3,
    'edge',
    NULL,
    NULL,
    'https://avatars.dicebear.com/api/adventurer/alicesmith.svg',
    '2024-11-13 23:11:54',
    '2024-11-14 12:42:40',
    'Alice Smith'
  ),
  (
    5,
    'srakib17',
    NULL,
    NULL,
    'https://robohash.org/michaelbrown.png',
    '2024-11-13 23:11:54',
    '2024-11-14 12:42:40',
    'Michael Brown'
  ),
  (
    261,
    'srakib',
    NULL,
    NULL,
    'https://avatars.dicebear.com/api/bottts/emmajohnson.svg',
    '2024-11-14 01:00:55',
    '2024-11-14 12:42:40',
    'Emma Johnson'
  ),
  (
    270,
    'fsdf',
    NULL,
    NULL,
    'https://ui-avatars.com/api/?name=Oliver+Williams&background=random',
    '2024-11-14 01:20:19',
    '2024-11-14 12:42:40',
    'Oliver Williams'
  ),
  (
    286,
    'xsffsd',
    NULL,
    NULL,
    'https://avatars.dicebear.com/api/adventurer/sophiamartinez.svg',
    '2024-11-14 01:56:31',
    '2024-11-14 12:42:40',
    'Sophia Martinez'
  ),
  (
    337,
    'user_id',
    NULL,
    NULL,
    NULL,
    '2024-11-14 13:47:27',
    '2024-11-14 13:47:27',
    NULL
  ),
  (
    359,
    'xxxxxxxxxxxx',
    NULL,
    NULL,
    'https://ui-avatars.com/api/?name=xxxxxxxxxxxx&background=random',
    '2024-11-14 14:25:32',
    '2024-11-14 14:25:32',
    'xxxxxxxxxxxx'
  ),
  (
    360,
    'srakib17ccccccc',
    NULL,
    NULL,
    'https://ui-avatars.com/api/?name=srakib17ccccccc&background=random',
    '2024-11-14 14:27:26',
    '2024-11-14 14:27:26',
    'srakib17ccccccc'
  ),
  (
    361,
    'sarkib17',
    NULL,
    NULL,
    'https://ui-avatars.com/api/?name=sarkib17&background=random',
    '2024-11-15 08:37:52',
    '2024-11-15 08:37:52',
    'sarkib17'
  ),
  (
    362,
    'rakib17',
    NULL,
    NULL,
    'https://ui-avatars.com/api/?name=rakib17&background=random',
    '2024-11-15 08:47:31',
    '2024-11-15 08:47:31',
    'rakib17'
  ),
  (
    363,
    'sr',
    NULL,
    NULL,
    'https://ui-avatars.com/api/?name=sr&background=random',
    '2024-11-15 15:29:53',
    '2024-11-15 15:29:53',
    'sr'
  ),
  (
    364,
    'sfsdffsd',
    NULL,
    NULL,
    'https://ui-avatars.com/api/?name=sfsdffsd&background=random',
    '2024-11-15 15:30:43',
    '2024-11-15 15:30:43',
    'sfsdffsd'
  ),
  (
    365,
    'chrome',
    NULL,
    NULL,
    'https://ui-avatars.com/api/?name=chrome&background=random',
    '2024-11-16 11:10:26',
    '2024-11-16 11:10:26',
    'chrome'
  ),
  (
    366,
    'ege',
    NULL,
    NULL,
    'https://ui-avatars.com/api/?name=ege&background=random',
    '2024-11-16 11:17:25',
    '2024-11-16 11:17:25',
    'ege'
  ),
  (
    367,
    'fsdfsdf',
    NULL,
    NULL,
    'https://ui-avatars.com/api/?name=fsdfsdf&background=random',
    '2024-11-16 14:34:06',
    '2024-11-16 14:34:06',
    'fsdfsdf'
  ),
  (
    368,
    'de',
    NULL,
    NULL,
    'https://ui-avatars.com/api/?name=de&background=random',
    '2024-11-16 22:11:55',
    '2024-11-16 22:11:55',
    'de'
  ),
  (
    369,
    'testing aligle',
    NULL,
    NULL,
    'https://ui-avatars.com/api/?name=testing aligle&background=random',
    '2024-11-24 13:33:49',
    '2024-11-24 13:33:49',
    'testing aligle'
  );

/*!40000 ALTER TABLE `users` ENABLE KEYS */;

UNLOCK TABLES;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;

/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;

/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;

/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;

/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-01-12 11:25:52