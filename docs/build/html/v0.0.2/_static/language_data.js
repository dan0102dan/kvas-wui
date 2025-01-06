/*
 * This script contains the language-specific data used by searchtools.js,
 * namely the list of stopwords, stemmer, scorer and splitter.
 */

var stopwords = ["\u0430", "\u0431\u0435\u0437", "\u0431\u043e\u043b\u0435\u0435", "\u0431\u043e\u043b\u044c\u0448\u0435", "\u0431\u0443\u0434\u0435\u0442", "\u0431\u0443\u0434\u0442\u043e", "\u0431\u044b", "\u0431\u044b\u043b", "\u0431\u044b\u043b\u0430", "\u0431\u044b\u043b\u0438", "\u0431\u044b\u043b\u043e", "\u0431\u044b\u0442\u044c", "\u0432", "\u0432\u0430\u043c", "\u0432\u0430\u0441", "\u0432\u0434\u0440\u0443\u0433", "\u0432\u0435\u0434\u044c", "\u0432\u043e", "\u0432\u043e\u0442", "\u0432\u043f\u0440\u043e\u0447\u0435\u043c", "\u0432\u0441\u0435", "\u0432\u0441\u0435\u0433\u0434\u0430", "\u0432\u0441\u0435\u0433\u043e", "\u0432\u0441\u0435\u0445", "\u0432\u0441\u044e", "\u0432\u044b", "\u0433\u0434\u0435", "\u0433\u043e\u0432\u043e\u0440\u0438\u043b", "\u0434\u0430", "\u0434\u0430\u0436\u0435", "\u0434\u0432\u0430", "\u0434\u043b\u044f", "\u0434\u043e", "\u0434\u0440\u0443\u0433\u043e\u0439", "\u0435\u0433\u043e", "\u0435\u0435", "\u0435\u0439", "\u0435\u043c\u0443", "\u0435\u0441\u043b\u0438", "\u0435\u0441\u0442\u044c", "\u0435\u0449\u0435", "\u0436", "\u0436\u0435", "\u0436\u0438\u0437\u043d\u044c", "\u0437\u0430", "\u0437\u0430\u0447\u0435\u043c", "\u0437\u0434\u0435\u0441\u044c", "\u0438", "\u0438\u0437", "\u0438\u043b\u0438", "\u0438\u043c", "\u0438\u043d\u043e\u0433\u0434\u0430", "\u0438\u0445", "\u043a", "\u043a\u0430\u0436\u0435\u0442\u0441\u044f", "\u043a\u0430\u043a", "\u043a\u0430\u043a\u0430\u044f", "\u043a\u0430\u043a\u043e\u0439", "\u043a\u043e\u0433\u0434\u0430", "\u043a\u043e\u043d\u0435\u0447\u043d\u043e", "\u043a\u0442\u043e", "\u043a\u0443\u0434\u0430", "\u043b\u0438", "\u043b\u0443\u0447\u0448\u0435", "\u043c\u0435\u0436\u0434\u0443", "\u043c\u0435\u043d\u044f", "\u043c\u043d\u0435", "\u043c\u043d\u043e\u0433\u043e", "\u043c\u043e\u0436\u0435\u0442", "\u043c\u043e\u0436\u043d\u043e", "\u043c\u043e\u0439", "\u043c\u043e\u044f", "\u043c\u044b", "\u043d\u0430", "\u043d\u0430\u0434", "\u043d\u0430\u0434\u043e", "\u043d\u0430\u043a\u043e\u043d\u0435\u0446", "\u043d\u0430\u0441", "\u043d\u0435", "\u043d\u0435\u0433\u043e", "\u043d\u0435\u0435", "\u043d\u0435\u0439", "\u043d\u0435\u043b\u044c\u0437\u044f", "\u043d\u0435\u0442", "\u043d\u0438", "\u043d\u0438\u0431\u0443\u0434\u044c", "\u043d\u0438\u043a\u043e\u0433\u0434\u0430", "\u043d\u0438\u043c", "\u043d\u0438\u0445", "\u043d\u0438\u0447\u0435\u0433\u043e", "\u043d\u043e", "\u043d\u0443", "\u043e", "\u043e\u0431", "\u043e\u0434\u0438\u043d", "\u043e\u043d", "\u043e\u043d\u0430", "\u043e\u043d\u0438", "\u043e\u043f\u044f\u0442\u044c", "\u043e\u0442", "\u043f\u0435\u0440\u0435\u0434", "\u043f\u043e", "\u043f\u043e\u0434", "\u043f\u043e\u0441\u043b\u0435", "\u043f\u043e\u0442\u043e\u043c", "\u043f\u043e\u0442\u043e\u043c\u0443", "\u043f\u043e\u0447\u0442\u0438", "\u043f\u0440\u0438", "\u043f\u0440\u043e", "\u0440\u0430\u0437", "\u0440\u0430\u0437\u0432\u0435", "\u0441", "\u0441\u0430\u043c", "\u0441\u0432\u043e\u044e", "\u0441\u0435\u0431\u0435", "\u0441\u0435\u0431\u044f", "\u0441\u0435\u0433\u043e\u0434\u043d\u044f", "\u0441\u0435\u0439\u0447\u0430\u0441", "\u0441\u043a\u0430\u0437\u0430\u043b", "\u0441\u043a\u0430\u0437\u0430\u043b\u0430", "\u0441\u043a\u0430\u0437\u0430\u0442\u044c", "\u0441\u043e", "\u0441\u043e\u0432\u0441\u0435\u043c", "\u0442\u0430\u043a", "\u0442\u0430\u043a\u043e\u0439", "\u0442\u0430\u043c", "\u0442\u0435\u0431\u044f", "\u0442\u0435\u043c", "\u0442\u0435\u043f\u0435\u0440\u044c", "\u0442\u043e", "\u0442\u043e\u0433\u0434\u0430", "\u0442\u043e\u0433\u043e", "\u0442\u043e\u0436\u0435", "\u0442\u043e\u043b\u044c\u043a\u043e", "\u0442\u043e\u043c", "\u0442\u043e\u0442", "\u0442\u0440\u0438", "\u0442\u0443\u0442", "\u0442\u044b", "\u0443", "\u0443\u0436", "\u0443\u0436\u0435", "\u0445\u043e\u0440\u043e\u0448\u043e", "\u0445\u043e\u0442\u044c", "\u0447\u0435\u0433\u043e", "\u0447\u0435\u043b\u043e\u0432\u0435\u043a", "\u0447\u0435\u043c", "\u0447\u0435\u0440\u0435\u0437", "\u0447\u0442\u043e", "\u0447\u0442\u043e\u0431", "\u0447\u0442\u043e\u0431\u044b", "\u0447\u0443\u0442\u044c", "\u044d\u0442\u0438", "\u044d\u0442\u043e\u0433\u043e", "\u044d\u0442\u043e\u0439", "\u044d\u0442\u043e\u043c", "\u044d\u0442\u043e\u0442", "\u044d\u0442\u0443", "\u044f"];


/* Non-minified version is copied as a separate JS file, if available */
BaseStemmer=function(){this.setCurrent=function(r){this.current=r;this.cursor=0;this.limit=this.current.length;this.limit_backward=0;this.bra=this.cursor;this.ket=this.limit};this.getCurrent=function(){return this.current};this.copy_from=function(r){this.current=r.current;this.cursor=r.cursor;this.limit=r.limit;this.limit_backward=r.limit_backward;this.bra=r.bra;this.ket=r.ket};this.in_grouping=function(r,t,i){if(this.cursor>=this.limit)return false;var s=this.current.charCodeAt(this.cursor);if(s>i||s<t)return false;s-=t;if((r[s>>>3]&1<<(s&7))==0)return false;this.cursor++;return true};this.in_grouping_b=function(r,t,i){if(this.cursor<=this.limit_backward)return false;var s=this.current.charCodeAt(this.cursor-1);if(s>i||s<t)return false;s-=t;if((r[s>>>3]&1<<(s&7))==0)return false;this.cursor--;return true};this.out_grouping=function(r,t,i){if(this.cursor>=this.limit)return false;var s=this.current.charCodeAt(this.cursor);if(s>i||s<t){this.cursor++;return true}s-=t;if((r[s>>>3]&1<<(s&7))==0){this.cursor++;return true}return false};this.out_grouping_b=function(r,t,i){if(this.cursor<=this.limit_backward)return false;var s=this.current.charCodeAt(this.cursor-1);if(s>i||s<t){this.cursor--;return true}s-=t;if((r[s>>>3]&1<<(s&7))==0){this.cursor--;return true}return false};this.eq_s=function(r){if(this.limit-this.cursor<r.length)return false;if(this.current.slice(this.cursor,this.cursor+r.length)!=r){return false}this.cursor+=r.length;return true};this.eq_s_b=function(r){if(this.cursor-this.limit_backward<r.length)return false;if(this.current.slice(this.cursor-r.length,this.cursor)!=r){return false}this.cursor-=r.length;return true};this.find_among=function(r){var t=0;var i=r.length;var s=this.cursor;var e=this.limit;var h=0;var u=0;var n=false;while(true){var c=t+(i-t>>>1);var a=0;var f=h<u?h:u;var l=r[c];var o;for(o=f;o<l[0].length;o++){if(s+f==e){a=-1;break}a=this.current.charCodeAt(s+f)-l[0].charCodeAt(o);if(a!=0)break;f++}if(a<0){i=c;u=f}else{t=c;h=f}if(i-t<=1){if(t>0)break;if(i==t)break;if(n)break;n=true}}do{var l=r[t];if(h>=l[0].length){this.cursor=s+l[0].length;if(l.length<4)return l[2];var v=l[3](this);this.cursor=s+l[0].length;if(v)return l[2]}t=l[1]}while(t>=0);return 0};this.find_among_b=function(r){var t=0;var i=r.length;var s=this.cursor;var e=this.limit_backward;var h=0;var u=0;var n=false;while(true){var c=t+(i-t>>1);var a=0;var f=h<u?h:u;var l=r[c];var o;for(o=l[0].length-1-f;o>=0;o--){if(s-f==e){a=-1;break}a=this.current.charCodeAt(s-1-f)-l[0].charCodeAt(o);if(a!=0)break;f++}if(a<0){i=c;u=f}else{t=c;h=f}if(i-t<=1){if(t>0)break;if(i==t)break;if(n)break;n=true}}do{var l=r[t];if(h>=l[0].length){this.cursor=s-l[0].length;if(l.length<4)return l[2];var v=l[3](this);this.cursor=s-l[0].length;if(v)return l[2]}t=l[1]}while(t>=0);return 0};this.replace_s=function(r,t,i){var s=i.length-(t-r);this.current=this.current.slice(0,r)+i+this.current.slice(t);this.limit+=s;if(this.cursor>=t)this.cursor+=s;else if(this.cursor>r)this.cursor=r;return s};this.slice_check=function(){if(this.bra<0||this.bra>this.ket||this.ket>this.limit||this.limit>this.current.length){return false}return true};this.slice_from=function(r){var t=false;if(this.slice_check()){this.replace_s(this.bra,this.ket,r);t=true}return t};this.slice_del=function(){return this.slice_from("")};this.insert=function(r,t,i){var s=this.replace_s(r,t,i);if(r<=this.bra)this.bra+=s;if(r<=this.ket)this.ket+=s};this.slice_to=function(){var r="";if(this.slice_check()){r=this.current.slice(this.bra,this.ket)}return r};this.assign_to=function(){return this.current.slice(0,this.limit)}};
RussianStemmer=function(){var r=new BaseStemmer;var e=[["в",-1,1],["ив",0,2],["ыв",0,2],["вши",-1,1],["ивши",3,2],["ывши",3,2],["вшись",-1,1],["ившись",6,2],["ывшись",6,2]];var i=[["ее",-1,1],["ие",-1,1],["ое",-1,1],["ые",-1,1],["ими",-1,1],["ыми",-1,1],["ей",-1,1],["ий",-1,1],["ой",-1,1],["ый",-1,1],["ем",-1,1],["им",-1,1],["ом",-1,1],["ым",-1,1],["его",-1,1],["ого",-1,1],["ему",-1,1],["ому",-1,1],["их",-1,1],["ых",-1,1],["ею",-1,1],["ою",-1,1],["ую",-1,1],["юю",-1,1],["ая",-1,1],["яя",-1,1]];var u=[["ем",-1,1],["нн",-1,1],["вш",-1,1],["ивш",2,2],["ывш",2,2],["щ",-1,1],["ющ",5,1],["ующ",6,2]];var s=[["сь",-1,1],["ся",-1,1]];var a=[["ла",-1,1],["ила",0,2],["ыла",0,2],["на",-1,1],["ена",3,2],["ете",-1,1],["ите",-1,2],["йте",-1,1],["ейте",7,2],["уйте",7,2],["ли",-1,1],["или",10,2],["ыли",10,2],["й",-1,1],["ей",13,2],["уй",13,2],["л",-1,1],["ил",16,2],["ыл",16,2],["ем",-1,1],["им",-1,2],["ым",-1,2],["н",-1,1],["ен",22,2],["ло",-1,1],["ило",24,2],["ыло",24,2],["но",-1,1],["ено",27,2],["нно",27,1],["ет",-1,1],["ует",30,2],["ит",-1,2],["ыт",-1,2],["ют",-1,1],["уют",34,2],["ят",-1,2],["ны",-1,1],["ены",37,2],["ть",-1,1],["ить",39,2],["ыть",39,2],["ешь",-1,1],["ишь",-1,2],["ю",-1,2],["ую",44,2]];var t=[["а",-1,1],["ев",-1,1],["ов",-1,1],["е",-1,1],["ие",3,1],["ье",3,1],["и",-1,1],["еи",6,1],["ии",6,1],["ами",6,1],["ями",6,1],["иями",10,1],["й",-1,1],["ей",12,1],["ией",13,1],["ий",12,1],["ой",12,1],["ам",-1,1],["ем",-1,1],["ием",18,1],["ом",-1,1],["ям",-1,1],["иям",21,1],["о",-1,1],["у",-1,1],["ах",-1,1],["ях",-1,1],["иях",26,1],["ы",-1,1],["ь",-1,1],["ю",-1,1],["ию",30,1],["ью",30,1],["я",-1,1],["ия",33,1],["ья",33,1]];var c=[["ост",-1,1],["ость",-1,1]];var f=[["ейше",-1,1],["н",-1,2],["ейш",-1,1],["ь",-1,3]];var l=[33,65,8,232];var o=0;var n=0;function b(){n=r.limit;o=r.limit;var e=r.cursor;r:{e:while(true){i:{if(!r.in_grouping(l,1072,1103)){break i}break e}if(r.cursor>=r.limit){break r}r.cursor++}n=r.cursor;e:while(true){i:{if(!r.out_grouping(l,1072,1103)){break i}break e}if(r.cursor>=r.limit){break r}r.cursor++}e:while(true){i:{if(!r.in_grouping(l,1072,1103)){break i}break e}if(r.cursor>=r.limit){break r}r.cursor++}e:while(true){i:{if(!r.out_grouping(l,1072,1103)){break i}break e}if(r.cursor>=r.limit){break r}r.cursor++}o=r.cursor}r.cursor=e;return true}function _(){if(!(o<=r.cursor)){return false}return true}function k(){var i;r.ket=r.cursor;i=r.find_among_b(e);if(i==0){return false}r.bra=r.cursor;switch(i){case 1:r:{var u=r.limit-r.cursor;e:{if(!r.eq_s_b("а")){break e}break r}r.cursor=r.limit-u;if(!r.eq_s_b("я")){return false}}if(!r.slice_del()){return false}break;case 2:if(!r.slice_del()){return false}break}return true}function m(){r.ket=r.cursor;if(r.find_among_b(i)==0){return false}r.bra=r.cursor;if(!r.slice_del()){return false}return true}function v(){var e;if(!m()){return false}var i=r.limit-r.cursor;r:{r.ket=r.cursor;e=r.find_among_b(u);if(e==0){r.cursor=r.limit-i;break r}r.bra=r.cursor;switch(e){case 1:e:{var s=r.limit-r.cursor;i:{if(!r.eq_s_b("а")){break i}break e}r.cursor=r.limit-s;if(!r.eq_s_b("я")){r.cursor=r.limit-i;break r}}if(!r.slice_del()){return false}break;case 2:if(!r.slice_del()){return false}break}}return true}function d(){r.ket=r.cursor;if(r.find_among_b(s)==0){return false}r.bra=r.cursor;if(!r.slice_del()){return false}return true}function g(){var e;r.ket=r.cursor;e=r.find_among_b(a);if(e==0){return false}r.bra=r.cursor;switch(e){case 1:r:{var i=r.limit-r.cursor;e:{if(!r.eq_s_b("а")){break e}break r}r.cursor=r.limit-i;if(!r.eq_s_b("я")){return false}}if(!r.slice_del()){return false}break;case 2:if(!r.slice_del()){return false}break}return true}function w(){r.ket=r.cursor;if(r.find_among_b(t)==0){return false}r.bra=r.cursor;if(!r.slice_del()){return false}return true}function h(){r.ket=r.cursor;if(r.find_among_b(c)==0){return false}r.bra=r.cursor;if(!_()){return false}if(!r.slice_del()){return false}return true}function q(){var e;r.ket=r.cursor;e=r.find_among_b(f);if(e==0){return false}r.bra=r.cursor;switch(e){case 1:if(!r.slice_del()){return false}r.ket=r.cursor;if(!r.eq_s_b("н")){return false}r.bra=r.cursor;if(!r.eq_s_b("н")){return false}if(!r.slice_del()){return false}break;case 2:if(!r.eq_s_b("н")){return false}if(!r.slice_del()){return false}break;case 3:if(!r.slice_del()){return false}break}return true}this.stem=function(){var e=r.cursor;r:{while(true){var i=r.cursor;e:{i:while(true){var u=r.cursor;u:{r.bra=r.cursor;if(!r.eq_s("ё")){break u}r.ket=r.cursor;r.cursor=u;break i}r.cursor=u;if(r.cursor>=r.limit){break e}r.cursor++}if(!r.slice_from("е")){return false}continue}r.cursor=i;break}}r.cursor=e;b();r.limit_backward=r.cursor;r.cursor=r.limit;if(r.cursor<n){return false}var s=r.limit_backward;r.limit_backward=n;var a=r.limit-r.cursor;r:{e:{var t=r.limit-r.cursor;i:{if(!k()){break i}break e}r.cursor=r.limit-t;var c=r.limit-r.cursor;i:{if(!d()){r.cursor=r.limit-c;break i}}i:{var f=r.limit-r.cursor;u:{if(!v()){break u}break i}r.cursor=r.limit-f;u:{if(!g()){break u}break i}r.cursor=r.limit-f;if(!w()){break r}}}}r.cursor=r.limit-a;var l=r.limit-r.cursor;r:{r.ket=r.cursor;if(!r.eq_s_b("и")){r.cursor=r.limit-l;break r}r.bra=r.cursor;if(!r.slice_del()){return false}}var o=r.limit-r.cursor;h();r.cursor=r.limit-o;var _=r.limit-r.cursor;q();r.cursor=r.limit-_;r.limit_backward=s;r.cursor=r.limit_backward;return true};this["stemWord"]=function(e){r.setCurrent(e);this.stem();return r.getCurrent()}};
Stemmer = RussianStemmer;
