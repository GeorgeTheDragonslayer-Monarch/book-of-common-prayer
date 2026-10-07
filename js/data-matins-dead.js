window.MATINS_DEAD_TEMPLATE = {
  "title": "Matins of the Dead",
  "source": "Transcribed from pages/OfficeDead/MatinsDead.tex. Entirely English-only in its active content - the file's four bilingual pairs are all commented out in the source (two Latin versicle pairs at lines 108-109 and 201-202), so per the site's established practice of following the source's own choice of what is currently active, only the active English text is included. The Invitatory (Venite, Psalm 95, matching data/psalter.json verbatim) prints its 'Ant.' with a genuinely interleaved structure - alternating between a full form ('The King unto whom all live, * O come, let us adore him.') and a short form ('O come, let us adore him.') at specific points between verses, not merely before and after the whole psalm as in this site's ordinary daily Mattins Venite (data/mattins-template.json) - so this is transcribed as its own sequence of short canticle chunks with antiphon lines interleaved exactly where the source places them, rather than reused from that different, differently-structured file. The nine Psalms across the three Nocturns (5, 6, 7, 23, 25, 27, 40, 41, 42) all match data/psalter.json verbatim and are reproduced here as this page's own copy in the same antiphon/Requiem-versicle structure used throughout the Office of the Dead (no Gloria Patri anywhere; each Psalm's antiphon carries a {\\dag} dagger mark on its opening statement only, preserved as a literal †). The nine Lessons (from Job, cited by chapter and verse) and their nine Responsories follow the traditional Divine Office pattern where the 3rd and 6th Responsory of each set of three additionally insert the Requiem versicle (this time without the '*' pointing mark, exactly as printed) before a final repeat of the closing phrase; the 9th Lesson has no per-lesson Responsory of its own, its place taken by a separate 'Responsory' section giving two full alternate Responsories (for one-Nocturn and three-Nocturn use), each transcribed in full including their internal daggers and multiple '*' pointing marks, exactly as printed, line for line. Each Responsory's Respond/Versicle/repeated-Respond structure is preserved as three (or five) separate printed lines. The print-only page cross-references ('(p. \\pageref{laudsdead})', '(p. \\pageref{dead})') are dropped as meaningless on this site. The Conclusion's 'or,' alternate wording for the opening versicle and response is folded into a single parenthetical per line, matching the site's established convention for inline alternates.",
  "sections": [
    {
      "type": "heading",
      "text": "Matins of the Dead"
    },
    {
      "type": "rubric",
      "text": "Matins begins with the Lord's Prayer, Angelic Salutation, and {{Apostles}}' Creed, unless it should follow the carrying of the body to the Church or Matins & Lauds of the occurrent Office, in which case the Office immediately begins with the Invitatory or the Antiphon of the Nocturn."
    },
    {
      "type": "rubric",
      "text": "The following Invitatory is only said when the Office of the Dead is recited with three Nocturns (even when the rite is Semidouble) or when one Nocturn only is said but with Double rite."
    },
    {
      "type": "rubric",
      "text": "The Nocturns placed below, or one Nocturn only, may be said as noted—except on the day of a burial (on which the first Nocturn is always to be said) and in the Commemoration of All the Faithful Departed."
    },
    {
      "type": "inlineToggle",
      "toggle": "matinsDeadNocturns",
      "options": [
        {
          "value": "three",
          "label": "Three Nocturns"
        },
        {
          "value": "one",
          "label": "One Nocturn"
        }
      ]
    },
    {
      "type": "inlineToggle",
      "toggle": "matinsDeadNocturnPick",
      "nocturnsOption": "one",
      "options": [
        {
          "value": "1",
          "label": "Nocturn I (Sun, Mon, Thu)"
        },
        {
          "value": "2",
          "label": "Nocturn II (Tue, Fri)"
        },
        {
          "value": "3",
          "label": "Nocturn III (Wed, Sat)"
        }
      ]
    },
    {
      "type": "heading",
      "text": "Venite, exultemus"
    },
    {
      "type": "text",
      "text": "Ant. The King unto whom all live, * O come, let us adore him."
    },
    {
      "type": "text",
      "text": "Ant. The King unto whom all live, * O come, let us adore him."
    },
    {
      "type": "canticle",
      "dropcap": true,
      "text": "O come, let us sing unto the Lord : let us heartily rejoice in the strength of our salvation.\nLet us come before his presence with thanksgiving : and shew ourselves glad in him with psalms."
    },
    {
      "type": "text",
      "text": "Ant. The King unto whom all live, * O come, let us adore him."
    },
    {
      "type": "canticle",
      "text": "For the Lord is a great God : and a great King above all gods.\nIn his hand are all the corners of the earth : and the strength of the hills is his also."
    },
    {
      "type": "text",
      "text": "Ant. O come, let us adore him."
    },
    {
      "type": "canticle",
      "text": "The sea is his, and he made it : and his hands prepared the dry land.\nO come, let us worship and fall down : and kneel before the Lord our Maker.\nFor he is the Lord our God : and we are the people of his pasture, and the sheep of his hand."
    },
    {
      "type": "text",
      "text": "Ant. The King unto whom all live, * O come, let us adore him."
    },
    {
      "type": "canticle",
      "text": "To-day if ye will hear his voice, harden not your hearts : as in the provocation, and as in the day of temptation in the wilderness.\nWhen your fathers tempted me : proved me, and saw my works."
    },
    {
      "type": "text",
      "text": "Ant. O come, let us adore him."
    },
    {
      "type": "canticle",
      "text": "Forty years long was I grieved with this generation, and said : It is a people that do err in their hearts, for they have not known my ways;\nUnto whom I sware in my wrath : that they should not enter into my rest."
    },
    {
      "type": "text",
      "text": "Ant. The King unto whom all live, * O come, let us adore him."
    },
    {
      "type": "versicle",
      "v": "Rest eternal * grant unto them, O Lord.",
      "r": "And let light perpetual * shine upon them."
    },
    {
      "type": "text",
      "text": "Ant. O come, let us adore him."
    },
    {
      "type": "text",
      "text": "Ant. The King unto whom all live, * O come, let us adore him."
    },
    {
      "type": "heading",
      "text": "Nocturn I",
      "nocturnGroup": 1
    },
    {
      "type": "rubric",
      "text": "If only one Nocturn be said, Nocturn I is said on Sunday, Monday, & Thursday.",
      "nocturnGroup": 1,
      "nocturnsOption": "one"
    },
    {
      "type": "heading",
      "text": "Psalm 5. Verba mea auribus.",
      "nocturnGroup": 1
    },
    {
      "type": "text",
      "text": "Ant. Make thy way plain, † O Lord my God, before my face.",
      "nocturnGroup": 1,
      "omitUnlessDoubleOrHigher": true
    },
    {
      "type": "canticle",
      "dropcap": true,
      "text": "Ponder my words, O Lord : consider my meditation\nO hearken thou unto the voice of my calling, my King, and my God : for unto thee will I make my prayer.\nMy voice shalt thou hear betimes, O Lord : early in the morning will I direct my prayer unto thee, and will look up.\nFor thou art the God that hast no pleasure in wickedness : neither shall any evil dwell with thee.\nSuch as be foolish shall not stand in thy sight : for thou hatest all them that work vanity.\nThou shalt destroy them that speak leasing : the Lord will abhor both the blood-thirsty and deceitful man.\nBut as for me, I will come into thine house, even upon the multitude of thy mercy : and in thy fear will I worship toward thy holy temple.\nLead me, O Lord, in thy righteousness, because of mine enemies : make thy way plain before my face.\nFor there is no faithfulness in his mouth : their inward parts are very wickedness.\nTheir throat is an open sepulchre : they flatter with their tongue.\nDestroy thou them, O God; let them perish through their own imaginations : cast them out in the multitude of their ungodliness; for they have rebelled against thee.\nAnd let all them that put their trust in thee rejoice : they shall ever be giving of thanks, because thou defendest them; they that love thy Name shall be joyful in thee;\nFor thou, Lord, wilt give thy blessing unto the righteous : and with thy favourable kindness wilt thou defend him as with a shield.",
      "nocturnGroup": 1
    },
    {
      "type": "versicle",
      "v": "Rest eternal * grant unto them, O Lord.",
      "r": "And let light perpetual * shine upon them.",
      "nocturnGroup": 1
    },
    {
      "type": "text",
      "text": "Ant. Make thy way plain, O Lord my God, before my face.",
      "nocturnGroup": 1
    },
    {
      "type": "heading",
      "text": "Psalm 6. Domine, ne in furore",
      "nocturnGroup": 1
    },
    {
      "type": "text",
      "text": "Ant. Turn thee, † O Lord, and deliver my soul: for in death no man remembereth thee.",
      "nocturnGroup": 1,
      "omitUnlessDoubleOrHigher": true
    },
    {
      "type": "canticle",
      "dropcap": true,
      "text": "O Lord, rebuke me not in thine indignation : neither chasten me in thy displeasure.\nHave mercy upon me, O Lord, for I am weak : O Lord, heal me, for my bones are vexed.\nMy soul also is sore troubled : but, Lord, how long wilt thou punish me?\nTurn thee, O Lord, and deliver my soul : O save me for thy mercy's sake.\nFor in death no man remembereth thee : and who will give thee thanks in the pit?\nI am weary of my groaning; every night wash I my bed : and water my couch with my tears.\nMy beauty is gone for very trouble : and worn away because of all mine enemies.\nAway from me, all ye that work vanity : for the Lord hath heard the voice of my weeping.\nThe Lord hath heard my petition : the Lord will receive my prayer.\nAll mine enemies shall be confounded, and sore vexed : they shall be turned back, and put to shame suddenly.",
      "nocturnGroup": 1
    },
    {
      "type": "versicle",
      "v": "Rest eternal * grant unto them, O Lord.",
      "r": "And let light perpetual * shine upon them.",
      "nocturnGroup": 1
    },
    {
      "type": "text",
      "text": "Ant. Turn thee, O Lord, and deliver my soul: for in death no man remembereth thee.",
      "nocturnGroup": 1
    },
    {
      "type": "heading",
      "text": "Psalm 7. Domine, Deus meus",
      "nocturnGroup": 1
    },
    {
      "type": "text",
      "text": "Ant. Lest he devour † my soul like a lion, and tear it in pieces, while there is none to help.",
      "nocturnGroup": 1,
      "omitUnlessDoubleOrHigher": true
    },
    {
      "type": "canticle",
      "dropcap": true,
      "text": "O Lord my God, in thee have I put my trust : save me from all them that persecute me, and deliver me;\nLest he devour my soul, like a lion, and tear it in pieces : while there is none to help.\nO Lord my God, if I have done any such thing : or if there be any wickedness in my hands;\nIf I have rewarded evil unto him that dealt friendly with me : yea, I have delivered him that without any cause is mine enemy,\nThen let mine enemy persecute my soul, and take me : yea, let him tread my life down upon the earth, and lay mine honour in the dust.\nStand up, O Lord, in thy wrath, and lift up thyself, because of the indignation of mine enemies : arise up for me in the judgement that thou hast commanded.\nAnd so shall the congregation of the people come about thee : for their sakes therefore lift up thyself again.\nThe Lord shall judge the people; give sentence with me, O Lord : according to my righteousness, and according to the innocency that is in me.\nO let the wickedness of the ungodly come to an end : but guide thou the just.\nFor the righteous God : trieth the very hearts and reins.\nMy help cometh of God : who preserveth them that are true of heart.\nGod is a righteous Judge, strong and patient : and God is provoked every day.\nIf a man will not turn, he will whet his sword : he hath bent his bow, and made it ready.\nHe hath prepared for him the instruments of death : he ordaineth his arrows against the persecutors.\nBehold, he travaileth with mischief : he hath conceived sorrow, and brought forth ungodliness.\nHe hath graven and digged up a pit : and is fallen on himself into the destruction that he made for other.\nFor his travail shall come upon his own head : and his wickedness shall fall on his own pate.\nI will give thanks unto the Lord, according to his righteousness : and I will praise the Name of the Lord most High.",
      "nocturnGroup": 1
    },
    {
      "type": "versicle",
      "v": "Rest eternal * grant unto them, O Lord.",
      "r": "And let light perpetual * shine upon them.",
      "nocturnGroup": 1
    },
    {
      "type": "text",
      "text": "Ant. Lest he devour my soul like a lion, and tear it in pieces, while there is none to help.",
      "nocturnGroup": 1
    },
    {
      "type": "versicle",
      "v": "From the gate of hell.",
      "r": "Deliver their souls, O Lord.",
      "nocturnGroup": 1
    },
    {
      "type": "rubric",
      "text": "The Lord's Prayer is said secretly.",
      "nocturnGroup": 1
    },
    {
      "type": "heading",
      "text": "Lesson 1. Job 7:16",
      "nocturnGroup": 1
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Let me alone; for my days are vanity. What is man, that thou shouldest magnify him? and that thou shouldest set thine heart upon him? And that thou shouldest visit him every morning, and try him every moment? How long wilt thou not depart from me, nor let me alone till I swallow down my spittle? I have sinned; what shall I do unto thee, O thou preserver of men? why hast thou set me as a mark against thee, so that I am a burden to myself? And why dost thou not pardon my transgression, and take away mine iniquity? for now shall I sleep in the dust; and thou shalt seek me in the morning, but I shall not be.",
      "nocturnGroup": 1
    },
    {
      "type": "versicle",
      "r": "I know † that my Redeemer liveth, and that he shall stand at the latter day upon the earth: * And in my flesh shall I see God my Saviour.",
      "nocturnGroup": 1
    },
    {
      "type": "versicle",
      "v": "Whom I shall see for myself, and mine eyes shall behold, and not another.",
      "nocturnGroup": 1
    },
    {
      "type": "versicle",
      "r": "And in my flesh shall I see God my Saviour.",
      "nocturnGroup": 1
    },
    {
      "type": "heading",
      "text": "Lesson 2. Job 10:1",
      "nocturnGroup": 1
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "My soul is weary of my life; I will leave my complaint upon myself; I will speak in the bitterness of my soul. I will say unto God, Do not condemn me; shew me wherefore thou contendest with me. Is it good unto thee that thou shouldest oppress, that thou shouldest despise the work of thine hands, and shine upon the counsel of the wicked? Hast thou eyes of flesh? or seest thou as man seeth? Are thy days as the days of man? are thy years as man's days, That thou enquirest after mine iniquity, and searchest after my sin? Thou knowest that I am not wicked; and there is none that can deliver out of thine hand.",
      "nocturnGroup": 1
    },
    {
      "type": "versicle",
      "r": "Thou who didst raise Lazarus † already corrupting from the grave; * Grant them rest, O Lord, and a place of forgiveness.",
      "nocturnGroup": 1
    },
    {
      "type": "versicle",
      "v": "Thou who shalt come to judge the quick and the dead, and the world by fire.",
      "nocturnGroup": 1
    },
    {
      "type": "versicle",
      "r": "Grant them rest, O Lord, and a place of forgiveness.",
      "nocturnGroup": 1
    },
    {
      "type": "heading",
      "text": "Lesson 3. Job 10:8",
      "nocturnGroup": 1
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Thine hands have made me and fashioned me together round about; yet thou dost destroy me. Remember, I beseech thee, that thou hast made me as the clay; and wilt thou bring me into dust again? Hast thou not poured me out as milk, and curdled me like cheese? Thou hast clothed me with skin and flesh, and hast fenced me with bones and sinews. Thou hast granted me life and favour, and thy visitation hath preserved my spirit.",
      "nocturnGroup": 1
    },
    {
      "type": "versicle",
      "r": "O Lord, † when thou comest to judge the earth, where shall I hide myself from the wrath of thy countenance? * For I have sinned grievously in my life.",
      "nocturnGroup": 1
    },
    {
      "type": "versicle",
      "v": "I am afraid of my transgressions, and I am ashamed before thee: when thou comest to judgment, O condemn me not.",
      "nocturnGroup": 1
    },
    {
      "type": "versicle",
      "r": "For I have sinned grievously in my life.",
      "nocturnGroup": 1
    },
    {
      "type": "versicle",
      "v": "Rest eternal grant unto them, O Lord: and let light perpetual shine upon them.",
      "nocturnGroup": 1
    },
    {
      "type": "versicle",
      "r": "For I have sinned grievously in my life.",
      "nocturnGroup": 1
    },
    {
      "type": "rubric",
      "text": "If only one Nocturn be said, Lauds begins immediately.",
      "nocturnGroup": 1,
      "nocturnsOption": "one"
    },
    {
      "type": "heading",
      "text": "Nocturn II",
      "nocturnGroup": 2
    },
    {
      "type": "rubric",
      "text": "Tuesday and Friday",
      "nocturnGroup": 2,
      "nocturnsOption": "one"
    },
    {
      "type": "heading",
      "text": "Psalm 23. Dominus regit me.",
      "nocturnGroup": 2
    },
    {
      "type": "text",
      "text": "Ant. He shall feed me † in a green pasture.",
      "nocturnGroup": 2,
      "omitUnlessDoubleOrHigher": true
    },
    {
      "type": "canticle",
      "dropcap": true,
      "text": "The Lord is my shepherd : therefore can I lack nothing.\nHe shall feed me in a green pasture : and lead me forth beside the waters of comfort.\nHe shall convert my soul : and bring me forth in the paths of righteousness, for his Name's sake.\nYea, though I walk through the valley of the shadow of death, I will fear no evil : for thou art with me; thy rod and thy staff comfort me.\nThou shalt prepare a table before me against them that trouble me : thou hast anointed my head with oil, and my cup shall be full.\nBut thy loving-kindness and mercy shall follow me all the days of my life : and I will dwell in the house of the Lord for ever.",
      "nocturnGroup": 2
    },
    {
      "type": "versicle",
      "v": "Rest eternal * grant unto them, O Lord.",
      "r": "And let light perpetual * shine upon them.",
      "nocturnGroup": 2
    },
    {
      "type": "text",
      "text": "Ant. He shall feed me in a green pasture.",
      "nocturnGroup": 2
    },
    {
      "type": "heading",
      "text": "Psalm 25. Ad te, Domine, levavi",
      "nocturnGroup": 2
    },
    {
      "type": "text",
      "text": "Ant. Remember not † the sins and offences of my youth, O Lord.",
      "nocturnGroup": 2,
      "omitUnlessDoubleOrHigher": true
    },
    {
      "type": "canticle",
      "dropcap": true,
      "text": "Unto thee, O Lord, will I lift up my soul; my God, I have put my trust in thee : O let me not be confounded, neither let mine enemies triumph over me.\nFor all they that hope in thee shall not be ashamed : but such as transgress without a cause shall be put to confusion.\nShew me thy ways, O Lord : and teach me thy paths.\nLead me forth in thy truth, and learn me : for thou art the God of my salvation; in thee hath been my hope all the day long.\nCall to remembrance, O Lord, thy tender mercies : and thy loving-kindnesses, which have been ever of old.\nO remember not the sins and offences of my youth : but according to thy mercy think thou upon me, O Lord, for thy goodness.\nGracious and righteous is the Lord : therefore will he teach sinners in the way.\nThem that are meek shall he guide in judgement : and such as are gentle, them shall he learn his way.\nAll the paths of the Lord are mercy and truth : unto such as keep his covenant and his testimonies.\nFor thy Name's sake, O Lord : be merciful unto my sin, for it is great.\nWhat man is he that feareth the Lord : him shall he teach in the way that he shall choose.\nHis soul shall dwell at ease : and his seed shall inherit the land.\nThe secret of the Lord is among them that fear him : and he will shew them his covenant.\nMine eyes are ever looking unto the Lord : for he shall pluck my feet out of the net.\nTurn thee unto me, and have mercy upon me : for I am desolate and in misery.\nThe sorrows of my heart are enlarged : O bring thou me out of my troubles.\nLook upon my adversity and misery : and forgive me all my sin.\nConsider mine enemies, how many they are : and they bear a tyrannous hate against me.\nO keep my soul, and deliver me : let me not be confounded, for I have put my trust in thee.\nLet perfectness and righteous dealing wait upon me : for my hope hath been in thee.\nDeliver Israel, O God : out of all his troubles.",
      "nocturnGroup": 2
    },
    {
      "type": "versicle",
      "v": "Rest eternal * grant unto them, O Lord.",
      "r": "And let light perpetual * shine upon them.",
      "nocturnGroup": 2
    },
    {
      "type": "text",
      "text": "Ant. Remember not the sins and offences of my youth, O Lord.",
      "nocturnGroup": 2
    },
    {
      "type": "heading",
      "text": "Psalm 27. Dominus illuminatio",
      "nocturnGroup": 2
    },
    {
      "type": "text",
      "text": "Ant. I believe † verily to see the goodness of the Lord in the land of the living.",
      "nocturnGroup": 2,
      "omitUnlessDoubleOrHigher": true
    },
    {
      "type": "canticle",
      "dropcap": true,
      "text": "The Lord is my light and my salvation; whom then shall I fear : the Lord is the strength of my life; of whom then shall I be afraid?\nWhen the wicked, even mine enemies and my foes, came upon me to eat up my flesh : they stumbled and fell.\nThough an host of men were laid against me, yet shall not my heart be afraid : and though there rose up war against me, yet will I put my trust in him.\nOne thing have I desired of the Lord, which I will require : even that I may dwell in the house of the Lord all the days of my life, to behold the fair beauty of the Lord, and to visit his temple.\nFor in the time of trouble he shall hide me in his tabernacle : yea, in the secret place of his dwelling shall he hide me, and set me up upon a rock of stone.\nAnd now shall he lift up mine head : above mine enemies round about me.\nTherefore will I offer in his dwelling an oblation with great gladness : I will sing, and speak praises unto the Lord.\nHearken unto my voice, O Lord, when I cry unto thee : have mercy upon me, and hear me.\nMy heart hath talked of thee, Seek ye my face : Thy face, Lord, will I seek.\nO hide not thou thy face from me : nor cast thy servant away in displeasure.\nThou hast been my succour : leave me not, neither forsake me, O God of my salvation.\nWhen my father and my mother forsake me : the Lord taketh me up.\nTeach me thy way, O Lord : and lead me in the right way, because of mine enemies.\nDeliver me not over into the will of mine adversaries : for there are false witnesses risen up against me, and such as speak wrong.\nI should utterly have fainted : but that I believe verily to see the goodness of the Lord in the land of the living.\nO tarry thou the Lord's leisure : be strong, and he shall comfort thine heart; and put thou thy trust in the Lord.",
      "nocturnGroup": 2
    },
    {
      "type": "versicle",
      "v": "Rest eternal * grant unto them, O Lord.",
      "r": "And let light perpetual * shine upon them.",
      "nocturnGroup": 2
    },
    {
      "type": "text",
      "text": "Ant. I believe verily to see the goodness of the Lord in the land of the living.",
      "nocturnGroup": 2
    },
    {
      "type": "versicle",
      "v": "The Lord shall set them with the princes.",
      "r": "Even with the princes of his people.",
      "nocturnGroup": 2
    },
    {
      "type": "rubric",
      "text": "The Lord's Prayer is said secretly.",
      "nocturnGroup": 2
    },
    {
      "type": "heading",
      "text": "Lesson 4. Job 13:22",
      "nocturnGroup": 2
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Then call thou, and I will answer: or let me speak, and answer thou me. How many are mine iniquities and sins? make me to know my transgression and my sin. Wherefore hidest thou thy face, and holdest me for thine enemy? Wilt thou break a leaf driven to and fro? and wilt thou pursue the dry stubble? For thou writest bitter things against me, and makest me to possess the iniquities of my youth. Thou puttest my feet also in the stocks, and lookest narrowly unto all my paths; thou settest a print upon the heels of my feet. And he, as a rotten thing, consumeth, as a garment that is moth eaten.",
      "nocturnGroup": 2
    },
    {
      "type": "versicle",
      "r": "Remember me, † O God, that my life is wind: * The eye of him that hath seen me shall see me no more.",
      "nocturnGroup": 2
    },
    {
      "type": "versicle",
      "v": "Out of the deep have I called unto thee, O Lord: Lord, hear my voice.",
      "nocturnGroup": 2
    },
    {
      "type": "versicle",
      "r": "The eye of him that hath seen me shall see me no more.",
      "nocturnGroup": 2
    },
    {
      "type": "heading",
      "text": "Lesson 5. Job 14:1",
      "nocturnGroup": 2
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Man that is born of a woman is of few days, and full of trouble. He cometh forth like a flower, and is cut down: he fleeth also as a shadow, and continueth not. And dost thou open thine eyes upon such an one, and bringest me into judgment with thee? Who can bring a clean thing out of an unclean? not one. Seeing his days are determined, the number of his months are with thee, thou hast appointed his bounds that he cannot pass; Turn from him, that he may rest, till he shall accomplish, as an hireling, his day.",
      "nocturnGroup": 2
    },
    {
      "type": "versicle",
      "r": "Woe is me, † O Lord, for I have sinned grievously all the days of my life! O wretched man, what shall I do? Whither shall I flee, but unto thee, O my God? * Have mercy upon me, when thou comest at the day of judgment.",
      "nocturnGroup": 2
    },
    {
      "type": "versicle",
      "v": "My soul is sore troubled; but, Lord, be thou my helper.",
      "nocturnGroup": 2
    },
    {
      "type": "versicle",
      "r": "Have mercy upon me, when thou comest at the day of judgment.",
      "nocturnGroup": 2
    },
    {
      "type": "heading",
      "text": "Lesson 6. Job 14:13",
      "nocturnGroup": 2
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "O that thou wouldest hide me in the grave, that thou wouldest keep me secret, until thy wrath be past, that thou wouldest appoint me a set time, and remember me! If a man die, shall he live again? all the days of my appointed time will I wait, till my change come. Thou shalt call, and I will answer thee: thou wilt have a desire to the work of thine hands. For now thou numberest my steps: dost thou not watch over my sin?",
      "nocturnGroup": 2
    },
    {
      "type": "versicle",
      "r": "Remember not † my trespasses, O Lord, * When thou shalt come to judge the world by fire.",
      "nocturnGroup": 2
    },
    {
      "type": "versicle",
      "v": "Make thy way plain before my face, O Lord my God.",
      "nocturnGroup": 2
    },
    {
      "type": "versicle",
      "r": "When thou shalt come to judge the world by fire.",
      "nocturnGroup": 2
    },
    {
      "type": "versicle",
      "v": "Rest eternal grant unto them, O Lord: and let light perpetual shine upon them.",
      "nocturnGroup": 2
    },
    {
      "type": "versicle",
      "r": "When thou shalt come to judge the world by fire.",
      "nocturnGroup": 2
    },
    {
      "type": "rubric",
      "text": "If only one Nocturn be said, Lauds begins immediately.",
      "nocturnGroup": 2,
      "nocturnsOption": "one"
    },
    {
      "type": "heading",
      "text": "Nocturn III",
      "nocturnGroup": 3
    },
    {
      "type": "rubric",
      "text": "Wednesday and Saturday",
      "nocturnGroup": 3,
      "nocturnsOption": "one"
    },
    {
      "type": "heading",
      "text": "Psalm 40. Expectans expectavi",
      "nocturnGroup": 3
    },
    {
      "type": "text",
      "text": "Ant. O Lord, † let it be thy pleasure to deliver me; make haste, O Lord, to help me.",
      "nocturnGroup": 3,
      "omitUnlessDoubleOrHigher": true
    },
    {
      "type": "canticle",
      "dropcap": true,
      "text": "I waited patiently for the Lord : and he inclined unto me, and heard my calling.\nHe brought me also out of the horrible pit, out of the mire and clay : and set my feet upon the rock, and ordered my goings.\nAnd he hath put a new song in my mouth : even a thanksgiving unto our God.\nMany shall see it, and fear : and shall put their trust in the Lord.\nBlessed is the man that hath set his hope in the Lord : and turned not unto the proud, and to such as go about with lies.\nO Lord my God, great are the wondrous works which thou hast done, like as be also thy thoughts which are to us-ward : and yet there is no man that ordereth them unto thee:\nIf I should declare them, and speak of them : they should be more than I am able to express.\nSacrifice and meat-offering thou wouldest not : but mine ears hast thou opened.\nBurnt-offerings, and sacrifice for sin, hast thou not required : then said I, Lo, I come,\nIn the volume of the book it is written of me, that I should fulfil thy will, O my God : I am content to do it; yea, thy law is within my heart.\nI have declared thy righteousness in the great congregation : lo, I will not refrain my lips, O Lord, and that thou knowest.\nI have not hid thy righteousness within my heart : my talk hath been of thy truth and of thy salvation.\nI have not kept back thy loving mercy and truth : from the great congregation.\nWithdraw not thou thy mercy from me, O Lord : let thy loving-kindness and thy truth alway preserve me.\nFor innumerable troubles are come about me; my sins have taken such hold upon me that I am not able to look up : yea, they are more in number than the hairs of my head, and my heart hath failed me.\nO Lord, let it be thy pleasure to deliver me : make haste, O Lord, to help me.\nLet them be ashamed and confounded together, that seek after my soul to destroy it : let them be driven backward and put to rebuke, that wish me evil.\nLet them be desolate, and rewarded with shame : that say unto me, Fie upon thee, fie upon thee.\nLet all those that seek thee be joyful and glad in thee : and let such as love thy salvation say alway, The Lord be praised.\nAs for me, I am poor and needy : but the Lord careth for me.\nThou art my helper and redeemer : make no long tarrying, O my God.",
      "nocturnGroup": 3
    },
    {
      "type": "versicle",
      "v": "Rest eternal * grant unto them, O Lord.",
      "r": "And let light perpetual * shine upon them.",
      "nocturnGroup": 3
    },
    {
      "type": "text",
      "text": "Ant. O Lord, let it be thy pleasure to deliver me; make haste, O Lord, to help me.",
      "nocturnGroup": 3
    },
    {
      "type": "heading",
      "text": "Psalm 41. Beatus qui intelligit",
      "nocturnGroup": 3
    },
    {
      "type": "text",
      "text": "Ant. Heal my soul, † O Lord, for I have sinned against thee.",
      "nocturnGroup": 3,
      "omitUnlessDoubleOrHigher": true
    },
    {
      "type": "canticle",
      "dropcap": true,
      "text": "Blessed is he that considereth the poor and needy : the Lord shall deliver him in the time of trouble.\nThe Lord preserve him, and keep him alive, that he may be blessed upon earth : and deliver not thou him into the will of his enemies.\nThe Lord comfort him, when he lieth sick upon his bed : make thou all his bed in his sickness.\nI said, Lord, be merciful unto me : heal my soul, for I have sinned against thee.\nMine enemies speak evil of me : When shall he die, and his name perish?\nAnd if he come to see me, he speaketh vanity : and his heart conceiveth falsehood within himself, and when he cometh forth he telleth it.\nAll mine enemies whisper together against me : even against me do they imagine this evil.\nLet the sentence of guiltiness proceed against him : and now that he lieth, let him rise up no more.\nYea, even mine own familiar friend, whom I trusted : who did also eat of my bread, hath laid great wait for me.\nBut be thou merciful unto me, O Lord : raise thou me up again, and I shall reward them.\nBy this I know thou favourest me : that mine enemy doth not triumph against me.\nAnd when I am in my health, thou upholdest me : and shalt set me before thy face for ever.\nBlessed be the Lord God of Israel : world without end. Amen.",
      "nocturnGroup": 3
    },
    {
      "type": "versicle",
      "v": "Rest eternal * grant unto them, O Lord.",
      "r": "And let light perpetual * shine upon them.",
      "nocturnGroup": 3
    },
    {
      "type": "text",
      "text": "Ant. Heal my soul, O Lord, for I have sinned against thee.",
      "nocturnGroup": 3
    },
    {
      "type": "heading",
      "text": "Psalm 42. Quemadmodum",
      "nocturnGroup": 3
    },
    {
      "type": "text",
      "text": "Ant. My soul is athirst for God, † yea, even for the living God: when shall I come to appear before the presence of the Lord.",
      "nocturnGroup": 3,
      "omitUnlessDoubleOrHigher": true
    },
    {
      "type": "canticle",
      "dropcap": true,
      "text": "Like as the hart desireth the water-brooks : so longeth my soul after thee, O God.\nMy soul is athirst for God, yea, even for the living God : when shall I come to appear before the presence of God?\nMy tears have been my meat day and night : while they daily say unto me, Where is now thy God?\nNow when I think thereupon, I pour out my heart by myself : for I went with the multitude, and brought them forth into the house of God;\nIn the voice of praise and thanksgiving : among such as keep holy-day.\nWhy art thou so full of heaviness, O my soul : and why art thou so disquieted within me?\nPut thy trust in God : for I will yet give him thanks for the help of his countenance.\nMy God, my soul is vexed within me : therefore will I remember thee concerning the land of Jordan, and the little hill of Hermon.\nOne deep calleth another, because of the noise of the water-pipes : all thy waves and storms are gone over me.\nThe Lord hath granted his loving-kindness in the day-time : and in the night-season did I sing of him, and made my prayer unto the God of my life.\nI will say unto the God of my strength, Why hast thou forgotten me : why go I thus heavily, while the enemy oppresseth me?\nMy bones are smitten asunder as with a sword : while mine enemies that trouble me cast me in the teeth;\nNamely, while they say daily unto me : Where is now thy God?\nWhy art thou so vexed, O my soul : and why art thou so disquieted within me?\nO put thy trust in God : for I will yet thank him, which is the help of my countenance, and my God.",
      "nocturnGroup": 3
    },
    {
      "type": "versicle",
      "v": "Rest eternal * grant unto them, O Lord.",
      "r": "And let light perpetual * shine upon them.",
      "nocturnGroup": 3
    },
    {
      "type": "text",
      "text": "Ant. My soul is athirst for God, yea, even for the living God: when shall I come to appear before the presence of the Lord.",
      "nocturnGroup": 3
    },
    {
      "type": "versicle",
      "v": "O deliver not the soul of thy turtle-dove unto the multitude of the enemies.",
      "r": "Forget not the congregation of the poor for ever.",
      "nocturnGroup": 3
    },
    {
      "type": "rubric",
      "text": "The Lord's Prayer is said secretly.",
      "nocturnGroup": 3
    },
    {
      "type": "heading",
      "text": "Lesson 7. Job 17:1",
      "nocturnGroup": 3
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "My breath is corrupt, my days are extinct, the graves are ready for me. Are there not mockers with me? and doth not mine eye continue in their provocation? Lay down now, put me in a surety with thee; who is he that will strike hands with me? My days are past, my purposes are broken off, even the thoughts of my heart. They change the night into day: the light is short because of darkness. If I wait, the grave is mine house: I have made my bed in the darkness. I have said to corruption, Thou art my father: to the worm, Thou art my mother, and my sister. And where is now my hope? as for my hope, who shall see it?",
      "nocturnGroup": 3
    },
    {
      "type": "versicle",
      "r": "The while I trespass daily † and have no repentance, the fear of death appalleth me: * Because in hell there is no redemption, have mercy upon me, O God, and save me.",
      "nocturnGroup": 3
    },
    {
      "type": "versicle",
      "v": "Save me, O God, for thy Name's sake, and deliver me in thy strength.",
      "nocturnGroup": 3
    },
    {
      "type": "versicle",
      "r": "Because in hell there is no redemption, have mercy upon me, O God, and save me.",
      "nocturnGroup": 3
    },
    {
      "type": "heading",
      "text": "Lesson 8. Job 19:20",
      "nocturnGroup": 3
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "My bone cleaveth to my skin and to my flesh, and I am escaped with the skin of my teeth. Have pity upon me, have pity upon me, O ye my friends; for the hand of God hath touched me. Why do ye persecute me as God, and are not satisfied with my flesh? Oh that my words were now written! oh that they were printed in a book! That they were graven with an iron pen and lead in the rock for ever! For I know that my redeemer liveth, and that he shall stand at the latter day upon the earth: And though after my skin worms destroy this body, yet in my flesh shall I see God: Whom I shall see for myself, and mine eyes shall behold, and not another; though my reins be consumed within me.",
      "nocturnGroup": 3
    },
    {
      "type": "versicle",
      "r": "Judge me not, † O Lord, according to my deeds; for I have done nothing worthy in thy sight: wherefore I humbly beseech thy Majesty, * That thou, O God, mayest do away mine offences.",
      "nocturnGroup": 3
    },
    {
      "type": "versicle",
      "v": "Wash me throughly, O Lord, from mine unrighteousness, and cleanse me from my sin.",
      "nocturnGroup": 3
    },
    {
      "type": "versicle",
      "r": "That thou, O God, mayest do away mine offences.",
      "nocturnGroup": 3
    },
    {
      "type": "heading",
      "text": "Lesson 9. Job 10:18",
      "nocturnGroup": 3
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Wherefore then hast thou brought me forth out of the womb? Oh that I had given up the ghost, and no eye had seen me! I should have been as though I had not been; I should have been carried from the womb to the grave. Are not my days few? cease then, and let me alone, that I may take comfort a little, Before I go whence I shall not return, even to the land of darkness and the shadow of death; A land of darkness, as darkness itself; and of the shadow of death, without any order, and where the light is as darkness.",
      "nocturnGroup": 3
    },
    {
      "type": "heading",
      "text": "Responsory",
      "nocturnGroup": 3
    },
    {
      "type": "rubric",
      "text": "The following Responsory is said when only the Third Nocturn is said.",
      "nocturnGroup": 3,
      "nocturnsOption": "one"
    },
    {
      "type": "versicle",
      "r": "Deliver me, O Lord, † from the paths of hell, thou that brakest in pieces the gates of brass; and visitedst hell, and gavest them light, that they might see thee, * Who dwelt in the pains of darkness.",
      "nocturnGroup": 3,
      "nocturnsOption": "one"
    },
    {
      "type": "versicle",
      "v": "Crying out and saying, Thou art come, O our Redeemer.",
      "nocturnGroup": 3,
      "nocturnsOption": "one"
    },
    {
      "type": "versicle",
      "r": "Who dwelt in the pains of darkness.",
      "nocturnGroup": 3,
      "nocturnsOption": "one"
    },
    {
      "type": "versicle",
      "v": "Rest eternal grant unto them, O Lord: and let light perpetual shine upon them.",
      "nocturnGroup": 3,
      "nocturnsOption": "one"
    },
    {
      "type": "versicle",
      "r": "Who dwelt in the pains of darkness.",
      "nocturnGroup": 3,
      "nocturnsOption": "one"
    },
    {
      "type": "rubric",
      "text": "If only one Nocturn be said, Lauds begins immediately.",
      "nocturnGroup": 3,
      "nocturnsOption": "one"
    },
    {
      "type": "rubric",
      "text": "The following Responsory is said when three Nocturns are said.",
      "nocturnGroup": 3,
      "nocturnsOption": "three"
    },
    {
      "type": "versicle",
      "r": "Deliver me, O Lord, † from death eternal in that day of trembling: * When heaven and earth shall be shaken: * When thou shalt come to judge the world by fire.",
      "nocturnGroup": 3,
      "nocturnsOption": "three"
    },
    {
      "type": "versicle",
      "v": "Trembling taketh hold upon me, and fearfulness, as the sifting draweth on and the wrath to come.",
      "nocturnGroup": 3,
      "nocturnsOption": "three"
    },
    {
      "type": "versicle",
      "r": "When heaven and earth shall be shaken.",
      "nocturnGroup": 3,
      "nocturnsOption": "three"
    },
    {
      "type": "versicle",
      "v": "Ah, that day, that day of anger, of calamity and misery; Ah that great day, and exceeding bitter!",
      "nocturnGroup": 3,
      "nocturnsOption": "three"
    },
    {
      "type": "versicle",
      "r": "When thou shalt come to judge the world by fire.",
      "nocturnGroup": 3,
      "nocturnsOption": "three"
    },
    {
      "type": "versicle",
      "v": "Rest eternal grant unto them, O Lord: and let light perpetual shine upon them.",
      "nocturnGroup": 3,
      "nocturnsOption": "three"
    },
    {
      "type": "versicle",
      "r": "Deliver me, O Lord, from death eternal in that day of trembling: When heaven and earth shall be shaken: When thou shalt come to judge the world by fire.",
      "nocturnGroup": 3,
      "nocturnsOption": "three"
    },
    {
      "type": "heading",
      "text": "Conclusion"
    },
    {
      "type": "rubric",
      "text": "The following Conclusion is said when Matins is separated from Lauds."
    },
    {
      "type": "versicle",
      "v": "The Lord be with you. (or, O Lord, hear our prayer.)",
      "r": "And with thy spirit. (or, And let our cry come unto thee.)"
    },
    {
      "type": "officeDeadCollect"
    },
    {
      "type": "versicle",
      "v": "Rest eternal * grant unto them, O Lord.",
      "r": "And let light perpetual * shine upon them."
    },
    {
      "type": "versicle",
      "v": "May they rest in peace.",
      "r": "Amen."
    },
    {
      "type": "end",
      "text": "Here Endeth the Order of Matins of the Dead."
    }
  ]
}
