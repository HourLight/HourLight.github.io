/**
 * 馥靈之鑰核心數據模組（加密版）
 * Hour Light Core Data Module - Protected
 * © 2026 馥靈之鑰國際有限公司 - 商業機密
 * 
 * ⚠️ 本檔案包含商業機密內容，受著作權法保護
 * 未經授權複製、修改、反編譯或散布將追究法律責任
 */

(function(global) {
  'use strict';
  
  var _k = 'HL_CORE_2026';
  var _v = Date.now();
  var _token = null;
  var _data = null;
  
  // 編碼數據
  var _d = [
    'CmNvbnN0IF90aXRsZXMgPSB7MTon6aCY6Iiq6ICFJywyOifoqr/lkozogIUnLDM6J+WJtemAoOiA',
    'hScsNDon5bu66YCg6ICFJyw1OifororpnanogIUnLDY6J+eFp+mhp+iAhScsNzon5o6i57Si6ICF',
    'Jyw4OifmjozmrIrogIUnLDk6J+aZuuiAhScsMTE6J+mdiOaAp+ebtOimuuiAhScsMjI6J+Wkp+W4',
    'q+W7uumAoOiAhScsMzM6J+Wkp+W4q+eZgueZkuiAhSd9OwoKY29uc3QgX05EID0gewoxOnt0Oifp',
    'oJjoiKrogIUnLGU6J+eNqOeri+OAgemWi+WJteOAgemgmOWwjicsbTpbJ+iFjue2kycsJ+iGvee2',
    'kyddLGVzOlsn5oGQ5oe8Jywn5YuH5rCjJ10sbHQ6J+eNqOeri+mWi+WJteOAgeacieaWueWQkeaE',
    'n+OAgeaVouWBmuaxuuWumuOAgeS4jeeVj+WbsOmboycsZGs6J+WtpOeNqOOAgeaOp+WItuOAgeWu',
    's+aAleWkseaVl+OAgeS4jemhmOaxguWKqScsaHQ6WyfohY4nLCfohoDog7EnLCfpqqjpqrwnLCfo',
    'gLPmnLUnXSxhbzpbJ+mbquadvicsJ+WyqeiYreiNiScsJ+m7keiDoeakkiddLHNsOiflvp7jgIzm',
    'iJHopoHorYnmmI7oh6rlt7HjgI3liLDjgIzmiJHmnKzkvoblsLHlpKDlpb3jgI0nLHdrOnt0cDon',
    '6ZaL5Ym16ICFJyxkczon44CM6K6T5oiR5L6G5bi244CNJyxzdDon542o56uL5rG6562W44CB5LiN',
    '5Zac5q2h6KKr566h44CB6ZyA6KaB6Ieq5Li75qyKJ30saW06e3RwOiflvoHmnI3ogIUnLHRyOifk',
    'uLvlsI7lnovjgIHllpzmraHluLbpoJjjgIHov73msYLpgY7nqIvmr5TntZDmnpzmm7ToiIjlpa4n',
    'LGhsOifoh6rkv6HnmoTooajpgZTmhb7mnJvvvIzog73ntabkuojkuZ/og73mjqXlj5cnLHNkOifl',
    'j6rpoafoh6rlt7HnmoTmu7/otrPvvIzmiormgKfnlbbmiJDlvoHmnI0nLHRpOiforpPku5bmhJ/o',
    'prrooqvpnIDopoHvvIzpganmmYLorpPku5bkuLvlsI4nfX0sCjI6e3Q6J+iqv+WSjOiAhScsZTon',
    '5ZCI5L2c44CB5pWP5oSf44CB6YCj57WQJyxtOlsn5b+D57aTJywn5b+D5YyF57aTJ10sZXM6Wyfl',
    'raTnjagnLCfpgKPntZAnXSxsdDon5pWP5oSf6auU6LK844CB5ZaE5pa86Kq/6Kej44CB55u06Ka6',
    '5by344CB5pOF6ZW35YK+6IG9Jyxkazon6KiO5aW944CB5rKS5pyJ55WM6ZmQ44CB5aSx5Y676Ieq',
    '5oiR44CB6KKr5YuV5pS75pOKJyxodDpbJ+W/gycsJ+Wwj+iFuCcsJ+ihgOa2suW+queSsCddLGFv',
    'Olsn546r55GwJywn6IyJ6I6JJywn5aSp56u66JG1J10sc2w6J+W+nuOAjOS9oOmWi+W/g+aIkeWw',
    'semWi+W/g+OAjeWIsOOAjOaIkeWAkemDveWPr+S7pemWi+W/g+OAjScsd2s6e3RwOifljZToqr/o',
    'gIUnLGRzOifjgIzorpPmiJHkvobphY3lkIjjgI0nLHN0Oifph43oppblkozoq6fjgIHmk4Xplbfl',
    'nJjpmorlkIjkvZzjgIHpnIDopoHooqvoqo3lj68nfSxpbTp7dHA6J+mAo+e1kOiAhScsdHI6J+mH',
    'jeimluaDheaEn+mAo+e1kOOAgemcgOimgeWJjeaIsuWSjOawm+WcjeOAgeaVj+aEn+aYk+WPl+WC',
    'tycsaGw6J+a3seW6pueahOi6q+W/g+WQiOS4gOmrlOmpl++8jOalteW8t+eahOaEn+WPl+WKmycs',
    'c2Q6J+mBjuW6puiojuWlve+8jOeUqOaAp+S+huaPm+WPluaEmycsdGk6J+aDheaEn+avlOaKgOW3',
    'p+mHjeimge+8jOS6i+W+jOeahOaTgeaKsei3n+mBjueoi+S4gOaoo+mHjeimgSd9fSwKMzp7dDon',
    '5Ym16YCg6ICFJyxlOiflibXmhI/jgIHooajpgZTjgIHmqILop4AnLG06Wyfogp3ntpMnLCfohr3n',
    'tpMnXSxlczpbJ+Wjk+aKkScsJ+ihqOmBlCddLGx0OiflibXmhI/nhKHpmZDjgIHooajpgZTlipvl',
    'vLfjgIHmnInmhJ/mn5PlipvjgIHmqILop4DplovmnJcnLGRrOifomY7poK3om4flsL7jgIHooajp',
    'naLohprmt7rjgIHpgIPpgb/mt7HlsaTllY/poYzjgIHoh6rmiJHmibnoqZUnLGh0Olsn6IKdJywn',
    '6Ia9Jywn55y8552bJywn6IKM6IWxJ10sYW86WyfkvZvmiYvmn5EnLCfnlJzmqZknLCfmqrjmqqwn',
    'XSxzbDon5b6e44CM6ZaL5aeL5LiA55m+5YCL44CN5Yiw44CM5a6M5oiQ5LiA5YCL44CNJyx3azp7',
    'dHA6J+ihqOmBlOiAhScsZHM6J+OAjOiuk+aIkeS+huiqquOAjScsc3Q6J+WWnOatoeiuiuWMluOA',
    'geWJteaEj+eZvOaDs+OAgemcgOimgeiumue+juWSjOiInuWPsCd9LGltOnt0cDon6KGo5ryU6ICF',
    'Jyx0cjon5Zac5q2h6K6K5YyW5ZKM5paw6a6u5oSf44CB55So6KiA6Kqe6Kq/5oOF5b6I5Y6y5a6z',
    '44CB5Zac5q2h6YGK5oiy6KeS6Imy5omu5ryUJyxobDon5YWF5ru/5Ym15oSP5ZKM5qiC6Laj77yM',
    '6IO96K6T5oCn6K6K5b6X6LyV6ayG5aW9546pJyxzZDon5aSq5Zyo5oSP6KGo5ryU77yM55So5oCn',
    '5L6G6K2J5piO6Ieq5bex5pyJ6a2F5YqbJyx0aTon5L+d5oyB5paw6a6u5oSf5b6I6YeN6KaB77yM',
    '6K6a576O5LuW55qE5Ym15oSPJ319LAo0Ont0Oiflu7rpgKDogIUnLGU6J+epqeWumuOAgeWLmeWv',
    'puOAgeW7uuiorScsbTpbJ+iCuue2kycsJ+Wkp+iFuOe2kyddLGVzOlsn5YO15YyWJywn5b2I5oCn',
    'J10sbHQ6J+iFs+i4j+WvpuWcsOOAgeiyoOiyrOWPr+mdoOOAgee1hOe5lOWKm+W8t+OAgeiAkOWK',
    'm+mpmuS6uicsZGs6J+Wus+aAleiuiuWMluOAgeaUvuS4jeS4i+OAgeW3peS9nOeLguOAgeWkqumB',
    'juWDteWMlicsaHQ6WyfogronLCflpKfohbgnLCfnmq7ohponLCfpqqjpqrwnXSxhbzpbJ+WwpOWK',
    'oOWIqScsJ+e1suafjycsJ+iMtuaouSddLHNsOiflvp7jgIzmrbvlrojkuI3ororjgI3liLDjgIzn',
    'qankuK3msYLororjgI0nLHdrOnt0cDon5Z+36KGM6ICFJyxkczon44CM6K6T5oiR5L6G5YGa44CN',
    'JyxzdDon5oyJ6YOo5bCx54+t44CB6YeN6KaW5rWB56iL44CB6ZyA6KaB5piO56K655qE57WQ5qeL',
    'J30saW06e3RwOifnqanlrprogIUnLHRyOiflm7rlrprnmoTnr4DlpY/lkozmqKHlvI/jgIHph43o',
    'ppblronlhajmhJ/lkozkv6Hku7vjgIHpnIDopoHmmYLplpPmmpbmqZ8nLGhsOifnqanlrprjgIHm',
    'jIHkuYXjgIHlj6/pnaDvvIzmt7HljprnmoTkv6Hku7vln7rnpI4nLHNkOiflpKrliLblvI/vvIzm',
    'iormgKfnlbbmiJDjgIzkvovooYzlhazkuovjgI0nLHRpOifkuI3opoHlpKrlpJrpqZrllpzvvIzl',
    'u7rnq4vlm7rlrprnmoTopqrlr4blhIDlvI8nfX0sCjU6e3Q6J+iuiumdqeiAhScsZTon6Ieq55Sx',
    '44CB6K6K5YyW44CB5YaS6ZqqJyxtOlsn6IOD57aTJywn6IS+57aTJ10sZXM6WyfnhKbmha4nLCfo',
    'h6rlnKgnXSxsdDon6YGp5oeJ5Yqb5by344CB5Zac5q2h5YaS6Zqq44CB5aSa5omN5aSa6Jed44CB',
    '5LiN5oCV5pS56K6KJyxkazon5ryC5rOK5LiN5a6a44CB54Sh5rOV5om/6Ku+44CB6YGO5bqm5pS+',
    '57ix44CB54Sm6LqB5LiN5a6JJyxodDpbJ+iDgycsJ+iEvicsJ+iCjOiCiScsJ+a2iOWMluezu+e1',
    'sSddLGFvOlsn6JaRJywn55Sc5qmZJywn6JaE6I23J10sc2w6J+W+nuOAjOS4gOebtOWcqOmAg+OA',
    'jeWIsOOAjOmBuOaTh+WBnOeVmeOAjScsd2s6e3RwOiflhpLpmqrogIUnLGRzOifjgIzorpPmiJHk',
    'voboqabjgI0nLHN0OifllpzmraHororljJbjgIHkuI3mgJXmjJHmiLDjgIHoqI7ljq3ooqvmnZ/n',
    'uJsnfSxpbTp7dHA6J+WGkumaquiAhScsdHI6J+WWnOatoeWGkumaquWSjOWYl+ippuOAgeWuueaY',
    'k+WOreWApumHjeikh+OAgei/veaxguWIuua/gOWSjOiHqueUsScsaGw6J+mWi+aUvuOAgeWlveWl',
    'h+OAgeacieWvpumpl+eyvuelnicsc2Q6J+eUqOaAp+S+humAg+mBv+aJv+irvu+8jOaIkOeZruWC',
    'vuWQkScsdGk6J+S/neaMgeiuiuWMluWSjOmpmuWWnO+8jOS4gOi1t+aOoue0ouaWsOS6i+eJqSd9',
    'fSwKNjp7dDon54Wn6aGn6ICFJyxlOifosqzku7vjgIHmhJvjgIHmnI3li5knLG06WyfohL7ntpMn',
    'LCflv4PntpMnXSxlczpbJ+aOp+WIticsJ+S/oeS7uyddLGx0OifmnInmhJvlv4PjgIHosqDosqzk',
    'u7vjgIHnhafpoafku5bkurrjgIHlibXpgKDlkozoq6cnLGRrOifpgY7luqbku5jlh7rjgIHmjqfl',
    'iLbjgIHniqfnibLoh6rlt7HjgIHnhKHms5XmjqXlj5fluavliqknLGh0Olsn5b+D6IefJywn6IS+',
    '6IODJywn5Lmz5oi/Jywn5a2Q5a6uJ10sYW86WyfnjqvnkbAnLCfkvp3omK0nLCflpKnnq7rokbUn',
    'XSxzbDon5b6e44CM54Wn6aGn5omA5pyJ5Lq644CN5Yiw44CM5Lmf54Wn6aGn6Ieq5bex44CNJyx3',
    'azp7dHA6J+eFp+mhp+iAhScsZHM6J+OAjOiuk+aIkeS+humhp+OAjScsc3Q6J+mHjeimluWcmOma',
    'iuWSjOirp+OAgeaoguaWvOWKqeS6uuOAgemcgOimgeiiq+mcgOimgSd9LGltOnt0cDon54Wn6aGn',
    '6ICFJyx0cjon6YeN6KaW57Wm5LqI5bCN5pa55oSJ5oKF44CB5Zac5q2h54Wn6aGn5ZKM6KKr6ZyA',
    '6KaB44CB6YeN6KaW55Kw5aKD5ZKM5rCb5ZyNJyxobDon5rqr5pqW44CB6auU6LK844CB57Sw6Iap',
    '77yM6IO96K6T5bCN5pa55oSf6Ka66KKr5oSbJyxzZDon5Y+q6aGn5bCN5pa577yM54Sh5rOV5Lqr',
    '5Y+X6Ieq5bex55qE5oSJ5oKFJyx0aTon5Li75YuV54Wn6aGn5LuW77yM5ZGK6Ki05LuW77ya44CM',
    '5L2g55qE5oSJ5oKF5bCN5oiR5b6I6YeN6KaB44CNJ319LAo3Ont0OifmjqLntKLogIUnLGU6J+WF',
    'p+ecgeOAgeaZuuaFp+OAgemdiOaApycsbTpbJ+W/g+e2kycsJ+iFjue2kyddLGVzOlsn5oe355aR',
    'Jywn5L+h5Lu7J10sbHQ6J+aZuuaFp+a3seWIu+OAgeebtOimuuaVj+mKs+OAgeWWhOaWvOWIhuae',
    'kOOAgemdiOaAp+imuumGkicsZGs6J+mBjuW6puaHt+eWkeOAgeWtpOWDu+OAgeS4jeS/oeS7u+OA',
    'geWGt+a8oOeWj+mboicsaHQ6Wyflv4MnLCfohY4nLCfnpZ7ntpPns7vntbEnLCfohabpg6gnXSxh',
    'bzpbJ+S5s+mmmScsJ+aqgOmmmScsJ+iWsOiho+iNiSddLHNsOiflvp7jgIzkuI3mlrfliIbmnpDj',
    'gI3liLDjgIzlhYHoqLHkuI3nn6XpgZPjgI0nLHdrOnt0cDon5YiG5p6Q6ICFJyxkczon44CM6K6T',
    '5oiR5L6G5oOz44CNJyxzdDon542o56uL5oCd6ICD44CB6ZyA6KaB542o6JmV56m66ZaT44CB5LiN',
    '5Zac5q2h6KKr5omT5pO+J30saW06e3RwOifmjqLntKLogIUnLHRyOifpnIDopoHlv4PpnYjpgKPn',
    'tZDmiY3og73ouqvpq5TpgKPntZDjgIHlj6/og73lsI3ouqvpq5Tnlo/pm6LjgIHllpzmraHnoJTn',
    'qbblkozmjqLntKInLGhsOifouqvlv4PpnYjlkIjkuIDnmoTmt7Hluqbpq5TpqZcnLHNkOiflpKrl',
    'nKjohabooovoo6HvvIzouqvpq5TkuI3lnKgnLHRpOiflv4PpnYjpgKPntZDmmK/liY3mj5DvvIzn',
    'tabku5bmmYLplpPjgIzlm57liLDouqvpq5TjgI0nfX0sCjg6e3Q6J+aOjOasiuiAhScsZTon5qyK',
    '5Yqb44CB6LGQ55ub44CB5b2x6Z+/5YqbJyxtOlsn5bCP6IW457aTJywn6IaA6IOx57aTJ10sZXM6',
    'WyfosqrlqaonLCfmhbfmhagnXSxsdDon6aCY5bCO5Yqb5by344CB5pyJ5ZWG5qWt6aCt6IWm44CB',
    '6IO96IGa6ZuG6LOH5rqQ44CB5pyJ5b2x6Z+/5YqbJyxkazon5o6n5Yi244CB6LKq5amq44CB5bel',
    '5L2c54uC44CB54K66YGU55uu55qE5LiN5pOH5omL5q61JyxodDpbJ+W+queSsOezu+e1sScsJ+mX',
    'nOevgCcsJ+mqqOmqvCcsJ+iCjOiCiSddLGFvOlsn5rKS6JelJywn5qqA6aaZJywn6Zuq5p2+J10s',
    'c2w6J+W+nuOAjOaTgeacieabtOWkmuOAjeWIsOOAjOWIhuS6q+abtOWkmuOAjScsd2s6e3RwOifm',
    'jozmjqfogIUnLGRzOifjgIzorpPmiJHkvobnrqHjgI0nLHN0Oifnm67mqJnlsI7lkJHjgIHph43o',
    'ppbntZDmnpzjgIHpnIDopoHmjozmjqfmhJ8nfSxpbTp7dHA6J+aOjOaOp+iAhScsdHI6J+W8t+eD',
    'iOeahOiDvemHj+WSjOiAkOWKm+OAgeWWnOatoeaOjOaOp+aIluiiq+W+ueW6leaOjOaOp+OAgei/',
    'veaxgualteiHtOmrlOmplycsaGw6J+W8t+Wkp+eahOaAp+iDvemHj++8jOiDvee1puS6iOW8t+eD',
    'iOeahOmrlOmplycsc2Q6J+eUqOaAp+S+huWxleePvuasiuWKm++8jOaOp+WItuaFvumBjuW8tycs',
    'dGk6J+WPr+S7pemBqeW6puiuk+S7luaOjOaOp++8jOW8t+W6puimgeWkoCd9fSwKOTp7dDon5pm6',
    '6ICFJyxlOifmhYjmgrLjgIHmmbrmhafjgIHlrozmiJAnLG06WyfkuInnhKbntpMnLCflv4PljIXn',
    'tpMnXSxlczpbJ+Wft+iRlycsJ+aUvuS4iyddLGx0OifmhYjmgrLlpKfmhJvjgIHmmbrmhafmt7Hp',
    'gaDjgIHmnI3li5nkurrpoZ7jgIHmnInlpKfmoLzlsYAnLGRrOifpgY7luqbnkIbmg7PljJbjgIHo',
    'iIfnj77lr6bohKvnr4DjgIHmronpgZPogIXmg4XntZDjgIHnhKHms5XmjqXlnLAnLGh0Olsn5LiJ',
    '54SmJywn5YWN55ar57O757WxJywn5pW06auU5bmz6KGhJ10sYW86WyfkubPpppknLCfoirHmoqjm',
    'nKgnLCflu6Pol7/pppknXSxzbDon5b6e44CM5ouv5pWR5LiW55WM44CN5Yiw44CM5YWI54Wn6aGn',
    '5aW96Ieq5bex44CNJyx3azp7dHA6J+acjeWLmeiAhScsZHM6J+OAjOiuk+aIkeS+huW5q+OAjScs',
    'c3Q6J+mHjeimluaEj+e+qeOAgemhmOaZr+WwjuWQkeOAgemcgOimgemAo+e1kOabtOWkp+eahOeb',
    'ruaomSd9LGltOnt0cDon5aWJ54276ICFJyx0cjon6L+95rGC6Lqr5b+D6Z2I5ZCI5LiA44CB5Y+v',
    '6IO96Ka65b6X44CM5oCn5aSq5L2O5bGk5qyh44CN44CB6YeN6KaW5oSP576p5ZKM6YCj57WQJyxo',
    'bDon54Sh5qKd5Lu255qE5oSb6IiH5o6l57SN77yM6LaF6LaK6IKJ6auU55qE6YCj57WQJyxzZDon',
    '6YCD6YG/6Lqr6auU77yM5Y+q5rS75Zyo57K+56We5bGk6Z2iJyx0aTon6YCj57WQ5Yiw5pu05aSn',
    '55qE5oSP576p77yM5bmr5Yqp5LuW5Zue5Yiw6Lqr6auUJ319LAoxMTp7dDon6Z2I5oCn55u06Ka6',
    '6ICFJyxlOifnm7ToprrjgIHpnYjmgKfjgIHllZ/nmbwnLG06Wyflv4PljIXntpMnXSxlczpbJ+Ww',
    'gemWiScsJ+mWi+aUviddLGx0OifmpbXlvLfnm7ToprrlipvjgIHpnYjmgKfpgJrpgZPjgIHlpKnn',
    'lJ/nmYLnmZLogIXlkozlvJXlsI7ogIUnLGRrOifpgY7luqbmlY/mhJ/jgIHnhKbmha7kuI3lronj',
    'gIHnpZ7ntpPos6rjgIHoiIfnj77lr6bohKvnr4AnLGh0Olsn56We57aT57O757WxJywn5b+D5YyF',
    'Jywn5oOF57eS56mp5a6aJ10sYW86WyfkubPpppknLCfmqoDpppknLCfolrDooaPojYknLCfmqZno',
    'irEnXSxzbDon5oqK6Z2I5oCn6KiK5oGv6L2J5YyW54K65a+m6Zqb6KGM5YuVJyxtbTon5oiQ54K6',
    '6Z2I5oCn6IiH54++5a+m55qE5qmL5qiRJyx3azp7dHA6J+WVn+eZvOiAhScsZHM6J+OAjOiuk+aI',
    'keS+huaEn+aHieOAjScsc3Q6J+ebtOimuuaxuuetluOAgemcgOimgemdiOaEn+epuumWk+OAgemB',
    'qeWQiOmhp+WVj+irruipoid9LGltOnt0cDon6Z2I5oCn6YCj57WQ6ICFJyx0cjon6ZyA6KaB5rex',
    '5bqm6Z2I5oCn6YCj57WQ44CB5qW15bqm5pWP5oSf44CB6IO95oSf5oeJ5bCN5pa555qE5oOF57eS',
    'JyxobDon6Lqr5b+D6Z2I5a6M5YWo5ZCI5LiA55qE56We6IGW6auU6amXJyxzZDon5aSq5pWP5oSf',
    '6ICM54Sh5rOV5pS+6ayG5Lqr5Y+XJyx0aTon5Ym16YCg56We6IGW55qE56m66ZaT5ZKM5rCb5ZyN',
    'J319LAoyMjp7dDon5aSn5bir5bu66YCg6ICFJyxlOifpoZjmma/jgIHlu7roqK3jgIHlr6bnj74n',
    'LG06WyflhajntpPntaHmlbTlkIgnXSxlczpbJ+Wjk+WKmycsJ+aIkOWwsSddLGx0OifmiorlpKLm',
    'g7PokL3lnLDjgIHlu7rnq4vlpKflnovns7vntbHjgIHmnInpgaDopovkuZ/mnInln7fooYzlipsn',
    'LGRrOifpgY7luqblt6XkvZzjgIHlo5PlipvmpbXlpKfjgIHlv73nlaXmg4XmhJ/jgIHmjqfliLbp',
    'gY7luqYnLGh0Olsn5YWo6Lqr57O757Wx5bmz6KGhJywn54m55Yil5rOo5oSP6YGO5YueJ10sYW86',
    'Wyfpm6rmnb4nLCfmqoDpppknLCfmspLol6UnLCflsqnomK3ojYknXSxzbDon5LiN5Y+q5bu66YCg',
    '54mp6LOq5LiW55WM77yM5Lmf6KaB5bu66YCg6Z2I5oCn55qE5qmL5qiRJyxtbTon5bu66YCg5pyN',
    '5YuZ55y+55Sf55qE57O757WxJyx3azp7dHA6J+ezu+e1seW7uumAoOiAhScsZHM6J+OAjOiuk+aI',
    'keS+huW7uuani+OAjScsc3Q6J+mVt+mBoOimj+WKg+OAgeezu+e1seaAnee2rSd9LGltOnt0cDon',
    '5rex5bqm5bu66YCg6ICFJyx0cjon6L+95rGC6ZW35pyf56mp5a6a44CB5rex5bqm5om/6Ku+Jyxo',
    'bDon5bu656uL5rex5Y6a55qE6Kaq5a+G5Z+656SOJyxzZDon5aSq5bCI5rOo5LqL5qWt5b+955Wl',
    '6Kaq5a+GJyx0aTon6Kaq5a+G6Zec5L+C5Lmf5piv6YeN6KaB55qE5Lq655Sf5bu66KitJ319LAoz',
    'Mzp7dDon5aSn5bir55mC55mS6ICFJyxlOifnmYLnmZLjgIHmhYjmgrLjgIHmnI3li5knLG06Wyfl',
    'hajntpPntaHmlbTlkIgnXSxlczpbJ+eKp+eJsicsJ+acjeWLmSddLGx0OifnhKHmop3ku7bnmoTm',
    'hJvjgIHnmYLnmZLku5bkurrmt7HlsaTlibXlgrfjgIHlpKnnlJ/lsI7luKsnLGRrOifniqfnibLp',
    'gY7luqbjgIHnhKHms5XoqK3pmZDjgIHnh4Pnh5Loh6rlt7HjgIHlpLHljrvoh6rmiJEnLGh0Olsn',
    '5YWo6Lqr57O757Wx5bmz6KGhJywn54m55Yil5rOo5oSP6IO96YeP6ICX56utJ10sYW86Wyfnjqvn',
    'kbAnLCfkubPpppknLCfoirHmoqjmnKgnLCfmqZnoirEnXSxzbDon5Zyo5pyN5YuZ5LuW5Lq655qE',
    '5ZCM5pmC77yM5Lmf6KaB54Wn6aGn5aW96Ieq5bexJyxtbTon5oiQ54K654Sh5qKd5Lu25LmL5oSb',
    '55qE566h6YGTJyx3azp7dHA6J+eZgueZkuWwjuW4qycsZHM6J+OAjOiuk+aIkeS+hueZgueZkuOA',
    'jScsc3Q6J+acjeWLmeWwjuWQkeOAgemcgOimgeaEj+e+qeaEnyd9LGltOnt0cDon55mC55mS6ICF',
    'Jyx0cjon57Wm5LqI54Sh5qKd5Lu255qE5oSb5ZKM5o6l57SNJyxobDon6K6T5bCN5pa55oSf5Y+X',
    '5Yiw6KKr5a6M5YWo5o6l57SNJyxzZDon5Y+q5LuY5Ye65LiN5o6l5Y+XJyx0aTon5YWB6Kix6Ieq',
    '5bex5Lmf6KKr5oSbJ319Cn07Cgpjb25zdCBfUEQgPSB7CjE6e246J+WLh+awo+auvycsbWQ6J+iG',
    'vee2kycsdG06JzIzOjAwLTAxOjAwJyx0aDon5oiR5pWi5LiN5pWi5YGa6Ieq5bex77yfJyxkZTon',
    '5oGQ5oe844CB54y26LGr44CB5LiN5pWi6KGM5YuVJyxsZTon5YuH5rCj44CB5rG65pa344CB5pWi',
    '5pa85YGa6Ieq5bexJyxzcDpbJ+e4veaYr+WcqOetieOAjOa6luWCmeWlveOAjeaJjeihjOWLlScs',
    'J+Wus+aAleWBmumMr+axuuWumiddLHNxOlsn5aaC5p6c5LiN5oCV5aSx5pWX77yM5L2g5pyD5YGa',
    '5LuA6bq877yfJ10sYW86WyfolpEnLCfpu5Hog6HmpJInLCfmnZzmnb7mvL/mnpwnXX0sCjI6e246',
    'J+WKm+mHj+W7sycsbWQ6J+iCnee2kycsdG06JzAxOjAwLTAzOjAwJyx0aDon5oiR55qE5Yqb6YeP',
    '5Y2h5Zyo5ZOq77yfJyxkZTon5oak5oCS44CB5aOT5oqR44CB54Sh5Yqb5oSfJyxsZTon5Ym16YCg',
    '5Yqb44CB55Sf5ZG95Yqb44CB5YmN6YCy5YuV5YqbJyxzcDpbJ+iOq+WQjeWFtuWmmeWwseeUn+aw',
    'o+aIlueFqei6gScsJ+imuuW+l+iHquW3seeahOWKm+mHj+iiq+Wjk+WItiddLHNxOlsn5L2g55qE',
    '5oak5oCS5Zyo5ZGK6Ki05L2g5LuA6bq877yfJ10sYW86WyfkvZvmiYvmn5EnLCfoloTojbcnLCfn',
    'voXppqzmtIvnlJjoj4onXX0sCjM6e246J+WRiuWIpeiLkScsbWQ6J+iCuue2kycsdG06JzAzOjAw',
    'LTA1OjAwJyx0aDon5oiR5pS+5LiN5LiL5LuA6bq877yfJyxkZTon5oKy5YK344CB5ZOA5oK844CB',
    '54Sh5rOV5pS+5LiLJyxsZTon5o6l5Y+X44CB5ZGK5Yil44CB6YeL54S2JyxzcDpbJ+WPjeimhuWb',
    'nuaDs+mBjuWOu+eahOS6iycsJ+eEoeazleWlveWlveiqquWGjeimiyddLHNxOlsn5L2g6YKE5rKS',
    '5pyJ5ZGK5Yil55qE5piv5LuA6bq877yfJ10sYW86WyfntbLmn48nLCfkubPpppknLCflsKTliqDl',
    'iKknXX0sCjQ6e246J+a3qOWMluWupCcsbWQ6J+Wkp+iFuOe2kycsdG06JzA1OjAwLTA3OjAwJyx0',
    'aDon5oiR6Kmy5Lif5o6J5LuA6bq877yfJyxkZTon5Z+36JGX44CB5Zuk56mN44CB6buP6IapJyxs',
    'ZTon5reo5YyW44CB6YeL5pS+44CB5riF54i9JyxzcDpbJ+WutuijoeWghua7v+eUqOS4jeWIsOea',
    'hOadseilvycsJ+eEoeazlee1kOadn+S4jemBqeWQiOeahOmXnOS/giddLHNxOlsn5L2g55qE5Lq6',
    '55Sf5pyJ5LuA6bq844CM5bui54mp44CN6ZyA6KaB5riF55CG77yfJ10sYW86WyfmqrjmqqwnLCfo',
    'kaHokITmn5onLCfojLbmqLknXX0sCjU6e246J+a2iOWMlumWoycsbWQ6J+iDg+e2kycsdG06JzA3',
    'OjAwLTA5OjAwJyx0aDon5oiR5raI5YyW5LiN5LqG5LuA6bq877yfJyxkZTon54Sm5oWu44CB5pOU',
    '5oaC44CB54Sh5rOV5o6l5Y+XJyxsZTon5o6l57SN44CB5raI5YyW44CB6L2J5YyWJyxzcDpbJ+Ww',
    'jeacquS+huWFhea7v+eEpuaFricsJ+iDg+mDqOe2k+W4uOS4jeiIkuacjSddLHNxOlsn5LuA6bq8',
    '5LqL5oOF6K6T5L2g44CM5Zql5LiN5LiL5Y6744CN77yfJ10sYW86WyfnlJzmqZknLCfolpEnLCfo',
    'sYbolLsnXX0sCjY6e246J+S/oeS7u+auvycsbWQ6J+iEvue2kycsdG06JzA5OjAwLTExOjAwJyx0',
    'aDon5oiR5oOz5aSq5aSa5LuA6bq877yfJyxkZTon6YGO5bqm5oCd5oWu44CB5pOU5oaC44CB5o6n',
    '5Yi2JyxsZTon5L+h5Lu744CB6Iej5pyN44CB5Lqk6KiXJyxzcDpbJ+S7gOm6vOS6i+mDveimgeaD',
    's+S4iemBjScsJ+W+iOmbo+S/oeS7u+WIpeS6uiddLHNxOlsn5L2g5LiN5L+h5Lu755qE5piv5LuA',
    '6bq877yfJ10sYW86WyfmqoDpppknLCflsqnomK3ojYknLCflv6vmqILpvKDlsL7ojYknXX0sCjc6',
    'e246J+W/g+mWgOWuricsbWQ6J+W/g+e2kycsdG06JzExOjAwLTEzOjAwJyx0aDon5oiR5ri05pyb',
    '5LuA6bq85oSb77yfJyxkZTon5a2k542o44CB6ZqU6Zui44CB5b+D54mGJyxsZTon6YCj57WQ44CB',
    '5Zac5oKF44CB5pWe6ZaLJyxzcDpbJ+imuuW+l+aykuacieS6uuecn+ato+aHguiHquW3sScsJ+a4',
    'tOacm+aEm+WNu+Wus+aAleWPl+WCtyddLHNxOlsn5L2g55qE5b+D54mG5Zyo5L+d6K235LuA6bq8',
    '77yfJ10sYW86WyfnjqvnkbAnLCfojInojoknLCfkvp3omK3kvp3omK0nXX0sCjg6e246J+aYjui+',
    'qOW7sycsbWQ6J+Wwj+iFuOe2kycsdG06JzEzOjAwLTE1OjAwJyx0aDon5oiR5YiG5LiN5riF5LuA',
    '6bq877yfJyxkZTon5re35LqC44CB5Zuw5oOR44CB54Sh5rOV5Yik5pa3JyxsZTon5piO6L6o44CB',
    '5riF5pmw44CB5pm65oWnJyxzcDpbJ+W4uOW4uOWcqOmBuOaTh+S4reezvue1kCcsJ+WIhuS4jea4',
    'heiqsOaYr+ecn+aci+WPiyddLHNxOlsn5L2g5YWn5b+D55qE6IGy6Z+z5Zyo6Kqq5LuA6bq877yf',
    'J10sYW86Wyfov7fov63pppknLCfnvoXli5InLCfoloTojbcnXX0sCjk6e246J+WNuOi8ieiLkScs',
    'bWQ6J+iGgOiDsee2kycsdG06JzE1OjAwLTE3OjAwJyx0aDon5oiR5omb6JGX5LuA6bq877yfJyxk',
    'ZTon5aOT5Yqb44CB57eK57mD44CB5om/5pOU6YGO5bqmJyxsZTon6YeL5pS+44CB6LyV6ayG44CB',
    '5rWB5YuVJyxzcDpbJ+iDjOmDqOWSjOiCqemguOe4veaYr+W+iOe3iicsJ+imuuW+l+iHquW3seim',
    'geaJm+aJgOacieeahOS6iyddLHNxOlsn5L2g6IOM5LiK5omb55qE5piv6Kqw55qE6LKs5Lu777yf',
    'J10sYW86WyfolrDooaPojYknLCfnlJzppqzprLHomK0nLCfoi6bmqZnokYknXX0sCjEwOntuOifl',
    'v5fmsKPmrr8nLG1kOifohY7ntpMnLHRtOicxNzowMC0xOTowMCcsdGg6J+aIkeWus+aAleS7gOm6',
    'vO+8nycsZGU6J+aBkOaHvOOAgeeEoeWKm+OAgei/t+WkseaWueWQkScsbGU6J+W/l+awo+OAgeaW',
    'ueWQkeOAgeeUn+WRveWKmycsc3A6WyfkuI3nn6XpgZPkurrnlJ/opoHlvoDlk6roo6HljrsnLCfl',
    'rrPmgJXlpLHmlZfmiYDku6XkuI3mlaLplovlp4snXSxzcTpbJ+WmguaenOS4jeWus+aAle+8jOS9',
    'oOaDs+aIkOeCuuS7gOm6vO+8nyddLGFvOlsn6Zuq5p2+Jywn5qqA6aaZJywn5rKS6JelJ119LAox',
    'MTp7bjon5pWe6ZaL6ZajJyxtZDon5b+D5YyF57aTJyx0bTonMTk6MDAtMjE6MDAnLHRoOifmiJHl',
    'nKjkv53orbfku4DpurzvvJ8nLGRlOiflsIHplonjgIHpmLLnpqbjgIHlraTnq4snLGxlOifplovm',
    'lL7jgIHnnJ/lr6bjgIHopqrlr4YnLHNwOlsn6KGo6Z2i6ZaL5pyX5L2G5YW25a+m5LiN6K6T5Lq6',
    '6Z2g6L+RJywn5a6z5oCV55yf5q2j55qE6Kaq5a+GJ10sc3E6WyfkvaDlrrPmgJXooqvnnIvopovk',
    'u4DpurzvvJ8nXSxhbzpbJ+eOq+eRsOiNiScsJ+apmeiKsScsJ+W7o+iXv+mmmSddfSwKMTI6e246',
    'J+W5s+ihoeWupCcsbWQ6J+S4ieeEpue2kycsdG06JzIxOjAwLTIzOjAwJyx0aDon5oiR5ZOq6KOh',
    '5LiN5bmz6KGh77yfJyxkZTon5aSx6KGh44CB5YiG6KOC44CB5LiN5Y2U6Kq/JyxsZTon5pW05ZCI',
    '44CB5bmz6KGh44CB5ZKM6KunJyxzcDpbJ+eUn+a0u+WQhOaWuemdouWatOmHjeS4jeW5s+ihoScs',
    'J+i6q+W/g+mdiOWIhumboueahOaEn+imuiddLHNxOlsn5L2g55qE55Sf5rS75ZOq6KOh5aSx6KGh',
    '5LqG77yfJ10sYW86WyflpKnnq7rokbUnLCfkubPpppknLCfoirHmoqjmnKgnXX0KfTsKCmNvbnN0',
    'IF9ZVCA9IHsKMTp7a3c6J+aWsOmWi+WniycsdGg6J+eoruWtkOiQjOiKvScsYWQ6J+WVn+WLleaW',
    'sOioiOeVq+OAgeWLh+aVouWBmuaxuuWumicscGM6JzHlrq7vvIjli4fmsKPmrr/vvIknLGZjOifp',
    'gJnkuIDlubTlroflrpnlnKjllY/kvaDvvJrjgIzkvaDmlaLkuI3mlaLlgZroh6rlt7HvvJ/jgI0n',
    'fSwKMjp7a3c6J+etieW+hScsdGg6J+iAkOW/g+iAleiAmCcsYWQ6J+W7uueri+WQiOS9nOOAgeet',
    'ieW+heaZguapnycscGM6JzLlrq7vvIjlipvph4/lu7PvvIknLGZjOifpgJnkuIDlubTlroflrpnl',
    'nKjllY/kvaDvvJrjgIzkvaDnmoTlipvph4/ljaHlnKjlk6rvvJ/jgI0nfSwKMzp7a3c6J+ihqOmB',
    'lCcsdGg6J+WJteaEj+e2u+aUvicsYWQ6J+iHquaIkeihqOmBlOOAgeekvuS6pOaLk+WxlScscGM6',
    'JzPlrq7vvIjlkYrliKXoi5HvvIknLGZjOifpgJnkuIDlubTlroflrpnlnKjllY/kvaDvvJrjgIzk',
    'vaDmlL7kuI3kuIvku4DpurzvvJ/jgI0nfSwKNDp7a3c6J+W7uuiorScsdGg6J+epqeWbuuWfuuek',
    'jicsYWQ6J+aJk+WcsOWfuuOAgeW7uueri+e1kOaniycscGM6JzTlrq7vvIjmt6jljJblrqTvvIkn',
    'LGZjOifpgJnkuIDlubTlroflrpnlnKjllY/kvaDvvJrjgIzkvaDoqbLkuJ/mjonku4DpurzvvJ/j',
    'gI0nfSwKNTp7a3c6J+iuiuWMlicsdGg6J+i9ieWei+eqgeegtCcsYWQ6J+aTgeaKseaUueiuiuOA',
    'geWLh+aWvOWGkumaqicscGM6JzXlrq7vvIjmtojljJbplqPvvIknLGZjOifpgJnkuIDlubTlrofl',
    'rpnlnKjllY/kvaDvvJrjgIzkvaDmtojljJbkuI3kuobku4DpurzvvJ/jgI0nfSwKNjp7a3c6J+iy',
    'rOS7uycsdGg6J+eFp+mhp+aUtuaIkCcsYWQ6J+WutuW6reiyrOS7u+OAgeaUtuepq+S7mOWHuics',
    'cGM6Jzblrq7vvIjkv6Hku7vmrr/vvIknLGZjOifpgJnkuIDlubTlroflrpnlnKjllY/kvaDvvJrj',
    'gIzkvaDmg7PlpKrlpJrku4DpurzvvJ/jgI0nfSwKNzp7a3c6J+ayiea+sScsdGg6J+WFp+WcqOaO',
    'oue0oicsYWQ6J+WPjeaAneWtuOe/kuOAgeeNqOiZleWFhembuycscGM6Jzflrq7vvIjlv4PploDl',
    'rq7vvIknLGZjOifpgJnkuIDlubTlroflrpnlnKjllY/kvaDvvJrjgIzkvaDmuLTmnJvku4Dpurzm',
    'hJvvvJ/jgI0nfSwKODp7a3c6J+aUtuepqycsdGg6J+ixkOebm+aIkOWwsScsYWQ6J+S6i+alreaI',
    'kOWKn+OAgeiyoeWLmeixkOaUticscGM6Jzjlrq7vvIjmmI7ovqjlu7PvvIknLGZjOifpgJnkuIDl',
    'ubTlroflrpnlnKjllY/kvaDvvJrjgIzkvaDliIbkuI3muIXku4DpurzvvJ/jgI0nfSwKOTp7a3c6',
    'J+e1kOadnycsdGg6J+WujOaIkOmHi+aUvicsYWQ6J+aUvuS4i+iIiuacieOAgea6luWCmeaWsOW+',
    'queSsCcscGM6Jznlrq7vvIjljbjovInoi5HvvIknLGZjOifpgJnkuIDlubTlroflrpnlnKjllY/k',
    'vaDvvJrjgIzkvaDmiZvokZfku4DpurzvvJ/jgI0nfSwKMTE6e2t3OifpnYjmgKfoprrphpInLHRo',
    'Oifnm7ToprrplovllZ8nLGFkOifkv6Hku7vnm7ToprrjgIHpnYjmgKfmiJDplbcnLHBjOicxMeWu',
    'ru+8iOaVnumWi+mWo++8iScsZmM6J+Wuh+WumeWcqOWVj+S9oO+8muOAjOS9oOWcqOS/neitt+S7',
    'gOm6vO+8n+OAjSd9LAoyMjp7a3c6J+Wkp+W4q+W7uumAoCcsdGg6J+mhmOaZr+iQveWcsCcsYWQ6',
    'J+W7uueri+mVt+mBoOezu+e1sScscGM6J+WFqOWuruS9jScsZmM6J+W7uumAoOacjeWLmeecvueU',
    'n+eahOapi+aokSd9LAozMzp7a3c6J+Wkp+W4q+eZgueZkicsdGg6J+eEoeaineS7tueahOaEmycs',
    'YWQ6J+eZgueZkuiHquW3seiIh+S7luS6uicscGM6J+WFqOWuruS9jScsZmM6J+aIkOeCuuaEm+ea',
    'hOeuoemBkyd9Cn07Cgpjb25zdCBfRlQgPSB7CjE6e2FnOicxLTEw5q2yJyxubTon56ul5bm05Y2w',
    '6KiYJyxkYzon55Sf5ZG955qE56ys5LiA5YCL5Y2B5bm077yM5aWg5a6a5a6J5YWo5oSf6IiH6Ieq',
    '5oiR6KqN55+l55qE5Z+656SOJ30sCjI6e2FnOicxMS0yMOatsicsbm06J+mdkuaYpeaOoue0oics',
    'ZGM6J+aOoue0ouiHquaIkeOAgeW7uueri+WDueWAvOingOOAgeWwi+aJvuiqjeWQjCd9LAozOnth',
    'ZzonMjEtMzDmrbInLG5tOifoh6rmiJHlu7rnq4snLGRjOifouI/lhaXnpL7mnIPjgIHlu7rnq4vk',
    'uovmpa3lkozpl5zkv4LnmoTmoLnln7onfSwKNDp7YWc6JzMxLTQw5q2yJyxubTon5qC55Z+656mp',
    '5Zu6JyxkYzon56mp5Zu65LqL5qWt44CB5om/5pOU6LKs5Lu744CB5bu656uL5a625bqtJ30sCjU6',
    'e2FnOic0MS01MOatsicsbm06J+i9ieWMluibu+iuiicsZGM6J+S4reW5tOi9ieWei+OAgemHjeaW',
    'sOWumue+qeiHquaIkSd9LAo2OnthZzonNTEtNjDmrbInLG5tOifosqzku7vmlLbmiJAnLGRjOifm',
    'lLbnqavliY3ljYrnlJ/nmoTliqrlipsnfSwKNzp7YWc6JzYxLTcw5q2yJyxubTon5pm65oWn5ZyT',
    '5ru/JyxkYzon5YWn5Zyo5o6i57Si44CB5YiG5Lqr5pm65oWnJ30sCjg6e2FnOic3MeatsisnLG5t',
    'OifpnYjmgKfmmIfoj68nLGRjOifotoXotornianos6rjgIHpnYjmgKflnJPmu78nfQp9OwoKcmV0',
    'dXJuIHtfTkQsX1BELF9ZVCxfRlQsX3RpdGxlc307Cg=='
  ];
  
  // 解碼數據（UTF-8 安全）
  function _decodeUTF8(encoded) {
    var binary = atob(encoded);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }
  function _decode() {
    try {
      var _s = _d.join('');
      var _b = _decodeUTF8(_s);
      var _f = new Function(_b);
      return _f();
    } catch(e) {
      console.error('Data decode failed');
      return null;
    }
  }
  
  var HLCore = {
    version: '2.1.0',
    
    init: function(token) {
      if (token === _k) {
        if (!_data) _data = _decode();
        _token = _data ? _v : null;
        return !!_token;
      }
      console.warn('HLCore: Invalid access key');
      return false;
    },
    
    getNumberData: function(num) {
      if (!_token || !_data) return null;
      var d = _data._ND[num];
      if (!d) return null;
      return {title:d.t,essence:d.e,meridian:d.m.join('、'),emotionSpectrum:d.es.join(' ←→ '),light:d.lt,dark:d.dk,health:d.ht.join('、'),oils:d.ao,soulLesson:d.sl,isMaster:!!d.mm,masterMission:d.mm||null,work:d.wk,intimacy:(typeof d.im==='object')?d.im:null};
    },
    
    getPalaceData: function(palace) {
      if (!_token || !_data) return null;
      var d = _data._PD[palace];
      if (!d) return null;
      return {name:d.n,meridian:d.md,time:d.tm,theme:d.th,darkEmotion:d.de,lightEmotion:d.le,stuckPattern:d.sp,soulQuestions:d.sq,oils:d.ao};
    },
    
    getYearTheme: function(num) {
      if (!_token || !_data) return null;
      var d = _data._YT[num];
      if (!d) return null;
      return {keyword:d.kw,theme:d.th,advice:d.ad,palace:d.pc,focus:d.fc};
    },
    
    getFortuneTheme: function(period) {
      if (!_token || !_data) return null;
      var d = _data._FT[period];
      if (!d) return null;
      return {age:d.ag,name:d.nm,desc:d.dc};
    },
    
    getAllNumbers: function() {
      if (!_token || !_data) return null;
      var result = {};
      var self = this;
      Object.keys(_data._ND).forEach(function(k) { result[k] = self.getNumberData(parseInt(k)); });
      return result;
    },
    
    getAllPalaces: function() {
      if (!_token || !_data) return null;
      var result = {};
      var self = this;
      Object.keys(_data._PD).forEach(function(k) { result[k] = self.getPalaceData(parseInt(k)); });
      return result;
    }
  };
  
  Object.freeze(HLCore);
  Object.defineProperty(global, 'HLCore', { value: HLCore, writable: false, configurable: false });
  
})(typeof window !== 'undefined' ? window : this);
