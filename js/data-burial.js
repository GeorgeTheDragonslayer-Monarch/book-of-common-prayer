window.BURIAL_TEMPLATE = {
  "title": "The Order for the Burial of the Dead",
  "source": "Transcribed from pages/Pastoral/Burial.tex. Entirely English-only, matching the source (no elcol bilingual pairs anywhere in this file). Only 4 cross marks in total, 2 mid-word ('bless' and 'hallow', each split at the point the source's \\ding{64} falls and fused with no surrounding space) and 2 standalone. The six Psalm 'Selections' (39, 90, 27, 46, 121, 130) are partial extracts rather than the complete psalms, so - per the site's convention of only reusing text that is genuinely shared, byte-identical source data - they are transcribed fresh from this file rather than reused from data/psalter.json. Purely typographic elements (the horizontal rule dividers, the \\lettspace vertical-space macro, the commented-out figure and the two commented-out elaborate-ceremonial rubrics superseded by simpler active ones) are dropped, matching the site's established practice of following the source's own choice of what is currently active. The print-only page cross-reference '(p. \\pageref{RequiemMasses})' is dropped as meaningless on this site. Task #199 (George's corrections doc): the 'Rest eternal' versicle instead-of-Gloria-Patri now repeats after each of the six Psalm Selections rather than once before all of them, matching the source rubric's own 'at the end of each Psalm' wording; the Lesson's citation, alternate-reading rubric, and hand-transcribed text were replaced by a single self-contained 'burialLesson' section type that resolves all three of the rubric's permitted readings (1 Corinthians 15:20 default, or Romans 8:14-39, or John 14:1-6) live against this site's own KJV dataset via window.Scripture.resolveCitation, behind an inline picker button, rather than hand-transcribing the two never-before-sourced alternatives; and the 'At the Grave' sentence's plain 'or,' divider is now an inlineToggle button (burialGraveSentence) instead of static rubric text, following the same established either/or-choice convention as Matrimony's Psalm 128/67 toggle.",
  "sections": [
    {
      "type": "heading",
      "text": "Reception of the Body"
    },
    {
      "type": "rubric",
      "text": "The Priest, meeting the Body at the entrance of the church yard, and prior to going before it either into the church or towards the grave, shall say or sing,\nNote, The Priest should be vested in surplice and black stole, and also, on more solemn occasions, in black cope."
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "I am the resurrection and the life, saith the Lord: he that believeth in me, though he were dead, yet shall he live: and whosoever liveth and believeth in me, shall never die.\nI know that my redeemer liveth, and that he shall stand at the latter day upon the earth: and though this body be destroyed, yet shall I see God: whom I shall see for myself, and mine eyes shall behold, and not as a stranger.\nWe brought nothing into this world, and it is certain we can carry nothing out. The Lord gave, and the Lord hath taken away; blessed be the name of the Lord."
    },
    {
      "type": "heading",
      "text": "Procession"
    },
    {
      "type": "rubric",
      "text": "A Clerk carrying the Cross goes before (and, on more solemn occasions, with two acolytes with candles), accompanied by another bearing Holy Water. As the Ministers and Clerks proceed into the Church, the following Responsory is begun."
    },
    {
      "type": "heading",
      "text": "Subvenite"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Come to his aid, ye Saints of God, come to meet him, ye Angels of the Lord. Receiving his soul, offering it in the sight of the Most High."
    },
    {
      "type": "versicle",
      "v": "May Christ receive thee, who hath called thee: and may the Angels lead thee unto Abraham's bosom.",
      "r": "Receiving his soul, offering it in the sight of the Most High."
    },
    {
      "type": "versicle",
      "v": "Rest eternal grant unto him, O Lord: and let light perpetual shine upon him.",
      "r": "Offering it in the sight of the Most High."
    },
    {
      "type": "rubric",
      "text": "The Coffin is set down in the midst of the Church, so that the feet of the departed, unless he be a Priest, are toward the High Altar; but if he be a Priest, his head is toward the Altar. Then Candles should be lighted about the Body."
    },
    {
      "type": "heading",
      "text": "Service in the Church"
    },
    {
      "type": "rubric",
      "text": "After they are come into the Church, and the Responsory hath been said, then shall be said one or more or the following Selections, taken from the Psalms. Instead of the {{Gloria Patri}} shall be said the following at the end of each Psalm."
    },
    {
      "type": "heading",
      "text": "Psalm 39. Dixi, Custodiam"
    },
    {
      "type": "canticle",
      "dropcap": true,
      "text": "Lord, let me know mine end, and the number of my days : that I may be certified how long I have to live.\nBehold, thou hast made my days as it were a span long : and mine age is even as nothing in respect of thee; and verily every man living is altogether vanity.\nFor man walketh in a vain shadow, and disquieteth himself in vain : he heapeth up riches, and cannot tell who shall gather them.\nAnd now, Lord, what is my hope : truly my hope is even in thee.\nDeliver me from all mine offences : and make me not a rebuke unto the foolish.\nI became dumb, and opened not my mouth : for it was thy doing.\nTake thy plague away from me : I am even consumed by the means of thy heavy hand.\nWhen thou with rebukes dost chasten man for sin, thou makest his beauty to consume away, like as it were a moth fretting a garment : every man therefore is but vanity.\nHear my prayer, O Lord, and with thine ears consider my calling : hold not thy peace at my tears.\nFor I am a stranger with thee : and a sojourner, as all my fathers were.\nO spare me a little, that I may recover my strength : before I go hence, and be no more seen."
    },
    {
      "type": "versicle",
      "v": "Rest eternal grant unto them, O Lord.",
      "r": "And let light perpetual shine upon them."
    },
    {
      "type": "heading",
      "text": "Psalm 90. Domine, refugium"
    },
    {
      "type": "canticle",
      "dropcap": true,
      "text": "Lord, thou hast been our refuge : from one generation to another.\nBefore the mountains were brought forth, or ever the earth and the world were made : thou art God from everlasting, and world without end.\nThou turnest man to destruction : again thou sayest, Come again, ye children of men.\nFor a thousand years in thy sight are but as yesterday : seeing that is past as a watch in the night.\nAs soon as thou scatterest them they are even as a sleep : and fade away suddenly like the grass.\nIn the morning it is green, and groweth up : but in the evening it is cut down, dried up, and withered.\nFor we consume away in thy displeasure : and are afraid at thy wrathful indignation.\nThou hast set our misdeeds before thee : and our secret sins in the light of thy countenance.\nFor when thou art angry all our days are gone : we bring our years to an end, as it were a tale that is told.\nThe days of our age are threescore years and ten; and though men be so strong that they come to fourscore years : yet is their strength then but labour and sorrow; so soon passeth it away, and we are gone.\nBut who regardeth the power of thy wrath : for even thereafter as a man feareth, so is thy displeasure.\nSo teach us to number our days : that we may apply our hearts unto wisdom."
    },
    {
      "type": "versicle",
      "v": "Rest eternal grant unto them, O Lord.",
      "r": "And let light perpetual shine upon them."
    },
    {
      "type": "heading",
      "text": "Psalm 27. Dominus illuminatio"
    },
    {
      "type": "canticle",
      "dropcap": true,
      "text": "The Lord is my light and my salvation; whom then shall I fear : the Lord is the strength of my life; of whom then shall I be afraid?\nWhen the wicked, even mine enemies and my foes, came upon me to eat up my flesh : they stumbled and fell.\nThough an host of men were laid against me, yet shall not my heart be afraid : and though there rose up war against me, yet will I put my trust in him.\nOne thing have I desired of the Lord, which I will require : even that I may dwell in the house of the Lord all the days of my life, to behold the fair beauty of the Lord, and to visit his temple.\nFor in the time of trouble he shall hide me in his tabernacle : yea, in the secret place of his dwelling shall he hide me, and set me up upon a rock of stone.\nAnd now shall he lift up mine head : above mine enemies round about me.\nTherefore will I offer in his dwelling an oblation with great gladness : I will sing, and speak praises unto the Lord.\nHearken unto my voice, O Lord, when I cry unto thee : have mercy upon me, and hear me.\nMy heart hath talked of thee, Seek ye my face : Thy face, Lord, will I seek.\nO hide not thou thy face from me : nor cast thy servant away in displeasure.\nThou hast been my succour : leave me not, neither forsake me, O God of my salvation.\nWhen my father and my mother forsake me : the Lord taketh me up.\nTeach me thy way, O Lord : and lead me in the right way, because of mine enemies.\nDeliver me not over into the will of mine adversaries : for there are false witnesses risen up against me, and such as speak wrong.\nI should utterly have fainted : but that I believe verily to see the goodness of the Lord in the land of the living.\nO tarry thou the Lord's leisure : be strong, and he shall comfort thine heart; and put thou thy trust in the Lord."
    },
    {
      "type": "versicle",
      "v": "Rest eternal grant unto them, O Lord.",
      "r": "And let light perpetual shine upon them."
    },
    {
      "type": "heading",
      "text": "Psalm 46. Deus noster refugium"
    },
    {
      "type": "canticle",
      "dropcap": true,
      "text": "God is our hope and strength : a very present help in trouble.\nTherefore will we not fear, though the earth be moved : and though the hills be carried into the midst of the sea;\nThough the waters thereof rage and swell : and though the mountains shake at the tempest of the same.\nThe rivers of the flood thereof shall make glad the city of God : the holy place of the tabernacle of the most Highest.\nGod is in the midst of her, therefore shall she not be removed : God shall help her, and that right early.\nThe heathen make much ado, and the kingdoms are moved : but God hath shewed his voice, and the earth shall melt away.\nThe Lord of hosts is with us : the God of Jacob is our refuge.\nO come hither, and behold the works of the Lord : what destruction he hath brought upon the earth.\nHe maketh wars to cease in all the world : he breaketh the bow, and knappeth the spear in sunder, and burneth the chariots in the fire.\nBe still then, and know that I am God : I will be exalted among the heathen, and I will be exalted in the earth.\nThe Lord of hosts is with us : the God of Jacob is our refuge."
    },
    {
      "type": "versicle",
      "v": "Rest eternal grant unto them, O Lord.",
      "r": "And let light perpetual shine upon them."
    },
    {
      "type": "heading",
      "text": "Psalm 121. Levavi oculus"
    },
    {
      "type": "canticle",
      "dropcap": true,
      "text": "I will lift up mine eyes unto the hills : from whence cometh my help.\nMy help cometh even from the Lord : who hath made heaven and earth.\nHe will not suffer thy foot to be moved : and he that keepeth thee will not sleep.\nBehold, he that keepeth Israel : shall neither slumber nor sleep.\nThe Lord himself is thy keeper : the Lord is thy defence upon thy right hand;\nSo that the sun shall not burn thee by day : neither the moon by night.\nThe Lord shall preserve thee from all evil : yea, it is even he that shall keep thy soul.\nThe Lord shall preserve thy going out, and thy coming in : from this time forth for evermore."
    },
    {
      "type": "versicle",
      "v": "Rest eternal grant unto them, O Lord.",
      "r": "And let light perpetual shine upon them."
    },
    {
      "type": "heading",
      "text": "Psalm 130. De profundis"
    },
    {
      "type": "canticle",
      "dropcap": true,
      "text": "Out of the deep have I called unto thee, O Lord : Lord, hear my voice.\nO let thine ears consider well : the voice of my complaint.\nIf thou, Lord, wilt be extreme to mark what is done amiss : O Lord, who may abide it?\nFor there is mercy with thee : therefore shalt thou be feared.\nI look for the Lord; my soul doth wait for him : in his word is my trust.\nMy soul fleeth unto the Lord : before the morning watch, I say, before the morning watch.\nO Israel, trust in the Lord, for with the Lord there is mercy : and with him is plenteous redemption.\nAnd he shall redeem Israel : from all his sins."
    },
    {
      "type": "versicle",
      "v": "Rest eternal grant unto them, O Lord.",
      "r": "And let light perpetual shine upon them."
    },
    {
      "type": "rubric",
      "text": "Then shall follow the Lesson."
    },
    {
      "type": "burialLesson"
    },
    {
      "type": "rubric",
      "text": "Here may be sung a Hymn or Anthem; and at the discretion of the Minister, the Apostles' Creed, the Lord's Prayer, and such other fitting Prayers as are elsewhere provided in this Book, ending with the prayers which followeth and the Blessing; the Minister, before the Prayers, first pronouncing,"
    },
    {
      "type": "versicle",
      "v": "The Lord be with you.",
      "r": "And with thy spirit."
    },
    {
      "type": "rubric",
      "text": "{{Let us pray.}}"
    },
    {
      "type": "collect",
      "dropcap": true,
      "text": "Absolve, we beseech thee, O Lord, the soul of thy servant N. from every bond of sin: that in the glory of the resurrection he may be raised up amid thy Saints and elect unto newness of life. Through Christ, our Lord. Amen."
    },
    {
      "type": "collect",
      "dropcap": true,
      "text": "Remember thy servant, O Lord, according to the favour which thou bearest unto thy people, and grant that, increasing in knowledge and love of thee, he may go from strength to strength, in the life of perfect service, in thy heavenly kingdom; through Jesus Christ our Lord, who liveth and reigneth with thee and the Holy Ghost, ever, one God, world without end. Amen."
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Unto God's gracious mercy and protection we commit you. The Lord bl ✠ ess you and keep you. The Lord make his face to shine upon you, and be gracious unto you. The Lord lift up his countenance upon you, and give you peace, both now and evermore. Amen."
    },
    {
      "type": "rubric",
      "text": "If a Requiem Mass be said, it is offered here."
    },
    {
      "type": "heading",
      "text": "Absolution of the Dead"
    },
    {
      "type": "rubric",
      "text": "If this office follow a Requiem Mass, the Priest takes off his chasuble and maniple, and puts on a black cope. He then proceeds to stand at the foot of the bier, where he says the following prayer."
    },
    {
      "type": "collect",
      "dropcap": true,
      "text": "Enter not into judgment with thy servant, O Lord, for in thy sight shall no man living be justified, except thou grant unto him remission of all his sins. Therefore, we beseech thee, let not the sentence of thy judgment fall upon him, whom the faithful prayer of Christian people commendeth unto thee: but by the succour of thy grace let him who while he lived was sealed with the sign of the Holy Trinity be found worthy to escape the avenging judgment: Who livest and reignest world without end. Amen."
    },
    {
      "type": "rubric",
      "text": "Then, the Cantor beginning, the Clerks standing around sing the following Responsory:"
    },
    {
      "type": "text",
      "text": "Deliver me, O Lord, * from death eternal in that fearful day: * When the heavens and the earth shall be shaken: * When thou shalt come to judge the world by fire. ℣. I am in fear and trembling till the sifting be upon us, and the wrath to come, * When the heavens and the earth shall be shaken. ℣. O that day that day of anger, of calamity and misery, a great day and exceeding bitter. * When thou shalt come to judge the world by fire. ℣. Rest eternal grant unto them, O Lord: and let light perpetual shine upon them."
    },
    {
      "type": "versicle",
      "r": "Deliver me, O Lord, * from death eternal in that fearful day: * When the heavens and the earth shall be shaken: * When thou shalt come to judge the world by fire."
    },
    {
      "type": "rubric",
      "text": "Towards the end of the Responsory, the Celebrant puts incense into the thurible, blessing it as usual, the Deacon ministering the boat."
    },
    {
      "type": "rubric",
      "text": "The Responsory ended, the Priest says,"
    },
    {
      "type": "versicle",
      "v": "Lord, have mercy upon us.",
      "r": "Christ, have mercy upon us."
    },
    {
      "type": "versicle",
      "v": "Lord, have mercy upon us."
    },
    {
      "type": "rubric",
      "text": "While the Lord's Prayer is said silently, the Priest goeth about the bier, sprinkling it with Holy Water, thrice on each side; and then in like manner he censes it, thrice on each side. He then says aloud,"
    },
    {
      "type": "versicle",
      "v": "And lead us not into temptation.",
      "r": "But deliver us from evil."
    },
    {
      "type": "versicle",
      "v": "From the gate of hell.",
      "r": "Deliver his soul, O Lord."
    },
    {
      "type": "versicle",
      "v": "May he rest in peace.",
      "r": "Amen."
    },
    {
      "type": "versicle",
      "v": "O Lord, hear my prayer.",
      "r": "And let my cry come unto thee."
    },
    {
      "type": "versicle",
      "v": "The Lord be with you.",
      "r": "And with thy spirit."
    },
    {
      "type": "rubric",
      "text": "{{Let us pray.}}"
    },
    {
      "type": "rubric",
      "text": "If the Body be present, the following Collect shall be said."
    },
    {
      "type": "collect",
      "dropcap": true,
      "text": "O God, whose property is ever to have mercy and to forgive, we humbly entreat thee for the soul of thy servant N., which thou hast this day commanded to depart from this world: deliver it not into the hands of the enemy, neither forget it at the last, but command that it be received by thy holy Angels, and brought unto the fatherland of paradise; that forasmuch as he hoped and believed in thee, he may not undergo the pains of hell, but may obtain everlasting felicity. Through Christ, our Lord. Amen."
    },
    {
      "type": "rubric",
      "text": "If the Body be not present, the following shall be said."
    },
    {
      "type": "collect",
      "dropcap": true,
      "text": "Absolve, O Lord, we beseech thee, the soul of thy servant N. from every bond of sin: that in the glory of the resurrection, he may be raised up amid thy Saints and elect unto newness of life. Through Christ, our Lord. Amen."
    },
    {
      "type": "rubric",
      "text": "Then, the Priest making a cross with his right hand over the bier, says,"
    },
    {
      "type": "versicle",
      "v": "Rest eternal grant unto him, O Lord.",
      "r": "And let light perpetual shine upon him."
    },
    {
      "type": "versicle",
      "v": "May he rest in peace.",
      "r": "Amen."
    },
    {
      "type": "rubric",
      "text": "The Celebrant, again making a cross over the bier, says without inflexion:"
    },
    {
      "type": "versicle",
      "v": "May his soul and the souls of all the faithful departed through the mercy of God rest in peace.",
      "r": "Amen."
    },
    {
      "type": "heading",
      "text": "Service at the Grave"
    },
    {
      "type": "rubric",
      "text": "While the Body is being borne from the Church to the Grave, the following shall be sung,"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Into Paradise * may the Angels lead thee: at thy coming may the Martyrs receive thee, and bring thee into the holy city Jerusalem. May the Choirs of Angels receive thee, and with Lazarus, once poor, mayest thou have eternal rest."
    },
    {
      "type": "heading",
      "text": "Blessing of the Grave"
    },
    {
      "type": "rubric",
      "text": "If the ground be unconsecrated, when the Priest and People arrive, the following blessing is said."
    },
    {
      "type": "rubric",
      "text": "{{Let us pray.}}"
    },
    {
      "type": "collect",
      "dropcap": true,
      "text": "O Lord Jesu Christ, who wast laid in the new tomb of Joseph, and didst thereby sanctify the grave to be a bed of hope to thy people: Vouchsafe, we beseech thee, to bless, ha ✠ llow, and consecrate this grave, that it may be a resting-place, peaceful and secure, for the body of thy servant which we are about to commit to thy gracious keeping; who art the resurrection and the life, and who livest and reignest with the Father and the Holy Ghost, one God, world without end. Amen."
    },
    {
      "type": "rubric",
      "text": "The Priest then sprinkles the grave with Holy Water, and then censes the Body and the Grave."
    },
    {
      "type": "heading",
      "text": "At the Grave"
    },
    {
      "type": "rubric",
      "text": "When they come to the Grave, while the Body is made ready to be laid into the earth, shall be sung or said,"
    },
    {
      "type": "inlineToggle",
      "toggle": "burialGraveSentence",
      "options": [
        {
          "value": "manOfWoman",
          "label": "Man, that is born of a woman"
        },
        {
          "value": "allThatFather",
          "label": "All that the Father giveth me"
        }
      ]
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Man, that is born of a woman, hath but a short time to live, and is full of misery. He cometh up, and is cut down, like a flower; he fleeth as it were a shadow, and never continueth in one stay.\nIn the midst of life we are in death; of whom may we seek for succour, but of thee, O Lord, who for our sins art justly displeased?\nYet, O Lord God most holy, O Lord most mighty, O holy and most merciful Saviour, deliver us not into the bitter pains of eternal death.\nThou knowest, Lord, the secrets of our hearts; shut not thy merciful ears to our prayer; but spare us, Lord most holy, O God most mighty, O holy and merciful Saviour, thou most worthy Judge eternal, suffer us not, at our last hour, for any pains of death, to fall from thee.",
      "burialGraveSentenceOption": "manOfWoman"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "All that the Father giveth me shall come to me: and him that cometh to me I will in no wise cast out.\nHe that raised up Jesus from the dead: will also quicken your mortal bodies by the spirit which dwelleth in you.\nWherefore my heart is glad, and my glory rejoiceth: my flesh also shall rest in hope.\nThou shalt show me the path of life; in thy presence is the fulness of joy: and at thy right hand there is pleasure for evermore.",
      "burialGraveSentenceOption": "allThatFather"
    },
    {
      "type": "rubric",
      "text": "Then, while the earth shall be cast upon the Body by some standing by, the Priest shall say,"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Unto Almighty God we commend the soul of our brother departed, and we commit his body to the ground; earth to earth, ashes to ashes, dust to dust; in sure and certain hope of the Resurrection unto eternal life, through our Lord Jesus Christ, at whose coming in glorious majesty to judge the world, the earth and the sea shall give up their dead; and the corruptible bodies of those who sleep in him shall be changed, and made like unto his own glorious body; according to the mighty working whereby he is able to subdue all things unto himself."
    },
    {
      "type": "rubric",
      "text": "Then shall be said or sung,"
    },
    {
      "type": "text",
      "text": "I heard a voice from heaven, saying unto me, Write, From henceforth blessed are the dead who die in the Lord: even so saith the Spirit; for they rest from their labours."
    },
    {
      "type": "canticle",
      "dropcap": true,
      "text": "Blessed ✠ be the Lord God of Israel; * for he hath visited and redeemed his people;\nAnd hath raised up a mighty salvation for us, * in the house of his servant David;\nAs he spake by the mouth of his holy Prophets, * which have been since the world began;\nThat we should be saved from our enemies, * and from the hand of all that hate us.\nTo perform the mercy promised to our forefathers, * and to remember his holy covenant;\nTo perform the oath which he sware to our forefather Abraham, * that he would give us;\nThat we being delivered out of the hand of our enemies * might serve him without fear;\nIn holiness and righteousness before him, * all the days of our life.\nAnd thou, child, shalt be called the prophet of the Highest: * for thou shalt go before the face of the Lord to prepare his ways;\nTo give knowledge of salvation unto his people * for the remission of their sins,\nThrough the tender mercy of our God; * whereby the day-spring from on high hath visited us;\nTo give light to them that sit in darkness, and in the shadow of death, * and to guide our feet into the way of peace."
    },
    {
      "type": "versicle",
      "v": "Rest eternal * grant unto them, O Lord.",
      "r": "And let light perpetual * shine upon them."
    },
    {
      "type": "text",
      "text": "I heard a voice from heaven, saying unto me, Write, From henceforth blessed are the dead who die in the Lord: even so saith the Spirit; for they rest from their labours."
    },
    {
      "type": "versicle",
      "v": "The Lord be with you.",
      "r": "And with thy spirit."
    },
    {
      "type": "rubric",
      "text": "{{Let us pray.}}"
    },
    {
      "type": "versicle",
      "v": "Lord, have mercy upon us.",
      "r": "Christ, have mercy upon us."
    },
    {
      "type": "versicle",
      "v": "Lord, have mercy upon us."
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Our Father, who art in heaven, Hallowed be thy Name. Thy kingdom come. Thy will be done on earth, As it is in heaven. Give us this day our daily bread. And forgive us our trespasses, As we forgive those who trespass against us. And lead us not into temptation; But deliver us from evil. Amen."
    },
    {
      "type": "rubric",
      "text": "Meanwhile, the Priest sprinkles the body with Holy Water."
    },
    {
      "type": "rubric",
      "text": "Then the Priest shall say that which followeth."
    },
    {
      "type": "collect",
      "dropcap": true,
      "text": "Grant, we beseech thee, O Lord, this mercy to thy servant departed; that, forasmuch as he desired to do thy will, he may not suffer the punishment of his misdeed: that, as true faith joined him to the company of the faithful here below, so in heaven thy mercy may number him among the angelic choirs. Through Christ, our Lord. Amen."
    },
    {
      "type": "rubric",
      "text": "The Priest may say one or more of the following Prayers, at his discretion."
    },
    {
      "type": "collect",
      "dropcap": true,
      "text": "O God, whose mercies cannot be numbered; Accept our prayers on behalf of the soul of thy servant departed, and grant him an entrance into the land of light and joy, in the fellowship of thy saints; through Jesus Christ our Lord. Amen."
    },
    {
      "type": "collect",
      "dropcap": true,
      "text": "Almighty God, with whom do live the spirits of those who depart hence in the Lord, and with whom the souls of the faithful, after they are delivered from the burden of the flesh, are in joy and felicity; We give thee hearty thanks for the good examples of all those thy servants, who, having finished their course in faith, do now rest from their labours. And we beseech thee, that we, with all those who are departed in the true faith of thy holy Name, may have our perfect consummation and bliss, both in body and soul, in thy eternal and everlasting glory; through Jesus Christ our Lord. Amen."
    },
    {
      "type": "collect",
      "dropcap": true,
      "text": "O merciful God, the Father of our Lord Jesus Christ, who is the Resurrection and the Life; in whom whosoever believeth, shall live, though he die; and whosoever liveth, and believeth in him, shall not die eternally; who also hath taught us, by his holy Apostle Saint Paul, not to be sorry, as men without hope, for those who sleep in him; We humbly beseech thee, O Father, to raise us from the death of sin unto the life of righteousness; that, when we shall depart this life, we may rest in him; and that, at the general Resurrection in the last day, we may be found acceptable in thy sight; and receive that blessing, which thy well-beloved Son shall then pronounce to all who love and fear thee, saying, Come, ye blessed children of my Father, receive the kingdom prepared for you from the beginning of the world. Grant this, we beseech thee, O merciful Father, through Jesus Christ, our Mediator and Redeemer. Amen."
    },
    {
      "type": "collect",
      "dropcap": true,
      "text": "The God of peace, who brought again from the dead our Lord Jesus Christ, the great Shepherd of the sheep, through the blood of the everlasting covenant; Make you perfect in every good work to do his will, working in you that which is well pleasing in his sight; through Jesus Christ, to whom be glory for ever and ever. Amen."
    },
    {
      "type": "collect",
      "dropcap": true,
      "text": "O almighty God, the God of the spirits of all flesh, who by a voice from heaven didst proclaim, Blessed are the dead who die in the Lord; Multiply, we beseech thee, to those who rest in Jesus, the manifold blessings of thy love, that the good work which thou didst begin in them may be perfected unto the day of Jesus Christ. And of thy mercy, O heavenly Father, vouchsafe that we, who now serve thee here on earth, may at last, together with them, be found meet to be partakers of the inheritance of the saints in light; for the sake of the same thy Son Jesus Christ our Lord. Amen."
    },
    {
      "type": "collect",
      "dropcap": true,
      "text": "Most merciful Father, who hast been pleased to take unto thyself the soul of this thy servant; Grant to us who are still in our pilgrimage, and who walk as yet by faith, that having served thee with constancy on earth, we may be joined hereafter with thy blessed saints in glory everlasting; through Jesus Christ our Lord. Amen."
    },
    {
      "type": "collect",
      "dropcap": true,
      "text": "O Lord Jesu Christ, who by thy death didst take away the sting of death; Grant unto us thy servants so to follow in faith where thou hast led the way, that we may at length fall asleep peacefully in thee, and awake up after thy likeness; through thy mercy, who livest with the Father and the Holy Ghost, one God, world without end. Amen."
    },
    {
      "type": "collect",
      "dropcap": true,
      "text": "Almighty and everliving God, we yield unto thee most high praise and hearty thanks, for the wonderful grace and virtue declared in all thy saints, who have been the choice vessels of thy grace, and the lights of the world in their several generations; most humbly beseeching thee to give us grace so to follow the example of their stedfastness in thy faith, and obedience to thy holy commandments, that at the day of the general Resurrection, we, with all those who are of the mystical body of thy Son, may be set on his right hand, and hear that his most joyful voice: Come, ye blessed of my Father, inherit the kingdom prepared for you from the foundation of the world. Grant this, O Father, for the sake of the same, thy Son Jesus Christ, our only Mediator and Advocate. Amen."
    },
    {
      "type": "rubric",
      "text": "The Priest then continues,"
    },
    {
      "type": "versicle",
      "v": "Rest eternal grant unto him, O Lord.",
      "r": "And let light perpetual shine upon him."
    },
    {
      "type": "versicle",
      "v": "May he rest in peace.",
      "r": "Amen."
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "May his soul, ✠ and the souls of all the faithful departed, through the mercy of God, rest in peace. Amen."
    },
    {
      "type": "rubric",
      "text": "The Priest then sprinkles the grave with Holy Water."
    },
    {
      "type": "heading",
      "text": "At the Burial of the Dead at Sea"
    },
    {
      "type": "rubric",
      "text": "The same office may be used; but instead of the Sentence of Committal, the Minister shall say,"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Unto Almighty God we commend the soul of our brother departed, and we commit his body to the deep; in sure and certain hope of the Resurrection unto eternal life, through our Lord Jesus Christ; at whose coming in glorious majesty to judge the world, the sea shall give up her dead; and the corruptible bodies of those who sleep in him shall be changed, and made like unto his glorious body; according to the mighty working whereby he is able to subdue all things unto himself."
    }
  ]
};
