/**
 * Game engine written in javascript leveraging jQuery.
 *
 * @author Brandon J L Bernal
 */
function clone(obj){
  var copy;
  // Handle the 3 simple types, and null or undefined
  if(null == obj || "object" != typeof obj) return obj;

  // Handle Date
  if(obj instanceof Date){
    copy = new Date();
    copy.setTime(obj.getTime());
    return copy;
  }

  // Handle Array
  if(obj instanceof Array){
    copy = [];
    for (var i = 0, len = obj.length; i < len; ++i){
      copy[i] = clone(obj[i]);
    }
    return copy;
  }

  // Handle Object
  if(obj instanceof Object){
    copy = {};
    for (var attr in obj){
      if(obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
    }
    return copy;
  }

  throw new Error("Unable to copy obj! Its type isn't supported.");
}
var debug = false;

var animations = new Array, animationClosers = new Array, players = new Array, projectiles = new Array;

// Default player object
var Player = {
  // Properties
  animation : {
    /*combatReady : {
      0 : {
        attack : false,
        frames : 15,
        loop : false,
        runTime : 2.25
      }
    },
    grappleKick : {
      1 : {
      },
      2 : {
      },
      3 : {
      }
    },
    grapplePunch : {
      1 : {
      },
      2 : {
      },
      3 : {
      }
    },
    idle : {
      0 : {
        attack : false,
        frames : 6,
        loop : true,
        runTime : 0.75
      }
    },
    kick : {
      1 : {
        attack : true,
        frames : 5,
        loop : false,
        runTime : 0.3
      },
      2 : {
        attack : true,
        frames : 5,
        loop : false,
        runTime : 0.5
      },
      3 : {
        attack : true,
        frames : 6,
        loop : false,
        runTime : 0.6
      }
    },
    moveDwn : {
      0 : {
        attack : false,
        eType : 'keydown',
        frames : 3,
        loop : false,
        runTime : 0.25
      }
    },
    moveDwnLft : {
      0 : {
        attack : false,
        eType : 'keydown',
        frames : 4,
        loop : false,
        runTime : 0.3
      }
    },
    moveDwnRht : {
      0 : {
        attack : false,
        eType : 'keydown',
        frames : 4,
        loop : false,
        runTime : 0.3
      }
    },
    moveLft : {
      0 : {
        attack : false,
        eType : 'keydown',
        frames : 6,
        loop : true,
        runTime : 0.5
      }
    },
    moveRht : {
      0 : {
        attack : false,
        eType : 'keydown',
        frames : 6,
        loop : true,
        runTime : 0.5
      }
    },
    moveUp : {
      0 : {
        attack : false,
        eType : 'keydown',
        frames : 8,
        loop : true,
        runTime : 0.75
      }
    },
    moveUpLft : {
      0 : {
        attack : false,
        eType : 'keydown',
        frames : 9,
        loop : true,
        runTime : 0.75
      }
    },
    moveUpRht : {
      0 : {
        attack : false,
        eType : 'keydown',
        frames : 9,
        loop : true,
        runTime : 0.75
      }
    },
    punch : {
      1 : {
        attack : true,
        frames : 3,
        loop : false,
        runTime : 0.2
      },
      2 : {
        attack : true,
        frames : 5,
        loop : false,
        runTime : 0.4
      },
      3 : {
        attack : true,
        frames : 8,
        loop : false,
        runTime : 0.7
      }
    }*/
  },
  blocking : false,
  hit : false,
  position : {
    bottom : 1,
    left : 100
  },
  projectile : {
    /*1 : {
      attack : true,
      frames : 8,
      loop : true,
      runTime : 0.3
    },
    2 : {
      attack : true,
      frames : 4,
      loop : true,
      runTime : 0.1
    },
    3 : {
      attack : true,
      frames : 8,
      loop : true,
      runTime : 0.1
    }*/
  },
  queue : {
    aniName : null,
    e : null
  },
  side : 'Lft',
  sprite : '',
  // Functions
  importAnimations : function(){
    var self = this;
    var json_url = './json/'+self.sprite.toLowerCase()+'Animations.json';
    $.ajaxSetup({async:false});
    $.getJSON(json_url).done(function(data){
      return self.loadAnimations(data);
    }).fail(function(){
      throw new Error("Unable to load animations for "+self.sprite+".");
      return false;
    });
    $.ajaxSetup({async:true});
  },
  loadAnimations : function(data){
    if(data.animation !=  undefined){
      for (var a in data.animation){
        this.animation[a] = data.animation[a];
      }
      for (var a in data.projectile){
        this.projectile[a] = data.projectile[a];
      }
      return true;
    }
    return false;
  },
  init : function(player, name){
    // @TODO: Verify spirte exists before trying to set anything
    this.player = player;
    this.sprite = name;
    return this.importAnimations();
  }
};

var animate = function(player, sprite, aniName, level, e){
  var theAnimation = players[player].animation[aniName][level];
  var thePlayer = players[player];
  var aniShft = (theAnimation.shift != undefined) ? theAnimation.shift : false;
  var aniShftEndFrm = (theAnimation.shiftEndFrame != undefined) ? theAnimation.shiftEndFrame : null;
  var aniShftPixAmt = (theAnimation.shiftPixAmt != undefined) ? theAnimation.shiftPixAmt: null;
  var aniShftStartFrm = (theAnimation.shiftStartFrame != undefined) ? theAnimation.shiftStartFrame : null;
  var attck = theAnimation.attack;
  var cp = theAnimation.createProjectile;
  var cpf = theAnimation.createProjectileFrame;
  var frms = theAnimation.frames;
  var loop = theAnimation.loop;
  var plyr = $('#player-'+player);
  var posBtm = thePlayer.position.bottom;
  var posLft = thePlayer.position.left;
  var prvFrm = 1, nxtFrm = prvFrm+1;
  var rnTm = Number(theAnimation.runTime)*1000;
  var side = thePlayer.side;
  var sprt = plyr.children('.'+sprite);
  var sprt_width = Number(sprt.css('width').substr(0,sprt.css('width').indexOf('px')).valueOf());
  var stage_width = Number($('#stage').css('width').substr(0,$('#stage').css('width').indexOf('px')));
  var shift = Math.ceil(sprt_width/frms);

  var collisionDetection = function(thePlayer){
    if(thePlayer.hit){
      return 0;
    }
    var damage = 0;
    $('#info').html('');

    $('#player-'+thePlayer.player+' .hurtBox').each(function(){
      var hurtBox = $(this);
      $('.hitBox').parent('div').parent('div').each(function(){
        if($(this).attr('id') != undefined && $(this).attr('id').charAt(7) != thePlayer.player){
          var hitBox = $(this).children('div').children('div.hitBox');

          var hitBoxCoordinates = {
            top: hitBox.offset().top,
            right: hitBox.offset().left+hitBox.width(),
            bottom: hitBox.offset().top+hitBox.height(),
            left: hitBox.offset().left
          };

          var hitBoxArea = (hitBoxCoordinates.bottom - hitBoxCoordinates.top)*(hitBoxCoordinates.right - hitBoxCoordinates.left);

          var hurtBoxCoordinates = {
            top: hurtBox.offset().top,
            right: hurtBox.offset().left+hurtBox.width(),
            bottom: hurtBox.offset().top+hurtBox.height(),
            left: hurtBox.offset().left
          };

          var collisionCoordinates = {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
          };

          if(hitBoxCoordinates.right<hurtBoxCoordinates.right && hitBoxCoordinates.right>hurtBoxCoordinates.left){
            collisionCoordinates.right = hitBoxCoordinates.right;
          }
          else if(hitBoxCoordinates.right>hurtBoxCoordinates.right && hitBoxCoordinates.left<hurtBoxCoordinates.right){
            collisionCoordinates.right = hurtBoxCoordinates.right;
          }

          if(hitBoxCoordinates.left>hurtBoxCoordinates.left && hitBoxCoordinates.left<hurtBoxCoordinates.right){
            collisionCoordinates.left = hitBoxCoordinates.left;
          }
          else if(hitBoxCoordinates.left<hurtBoxCoordinates.left && hitBoxCoordinates.right>hurtBoxCoordinates.left){
            collisionCoordinates.left = hitBoxCoordinates.right;
          }

          if(collisionCoordinates.left || collisionCoordinates.right){
            if(hitBoxCoordinates.top>hurtBoxCoordinates.top && hitBoxCoordinates.top<hurtBoxCoordinates.bottom){
              collisionCoordinates.top = hitBoxCoordinates.top;
            }
            else if (hitBoxCoordinates.top<hurtBoxCoordinates.top && hitBoxCoordinates.bottom>hurtBoxCoordinates.top){
              collisionCoordinates.top = hurtBoxCoordinates.top;
            }

            if(hitBoxCoordinates.bottom<hurtBoxCoordinates.bottom && hitBoxCoordinates.bottom>hurtBoxCoordinates.top){
              collisionCoordinates.bottom = hitBoxCoordinates.bottom;
            }
            else if (hitBoxCoordinates.bottom>hurtBoxCoordinates.bottom && hitBoxCoordinates.top<hurtBoxCoordinates.bottom){
              collisionCoordinates.bottom = hurtBoxCoordinates.bottom;
            }
          }
          var collisionArea = (collisionCoordinates.bottom - collisionCoordinates.top)*(collisionCoordinates.right - collisionCoordinates.left);

          if(collisionCoordinates.top != 0 && collisionCoordinates.left != 0 && collisionCoordinates.right != 0 && collisionCoordinates.bottom != 0){
            damage += Math.floor((collisionArea/hitBoxArea)*100);
            if (debug) {
              $('#info').html($(this).attr('id').charAt(7)+','+thePlayer.player+','+hurtBox.attr('class')+','+Math.floor((collisionArea/hitBoxArea)*100)+'%');
              console.log($('#info').text(), collisionCoordinates, Math.floor((collisionArea/hitBoxArea)*100)+'%');
            }
          }
        }
      });
    });

    return damage;
  };

  var loadFrames = function(player, sprite, aniName, level, frms){
    if(debug){
      $('.frameWindow .frames').html('');
      for(var a=1; a<(frms+1); a++){
        var sprtFrm;
        var hit_box = '<div class="hitBox"></div>';
        var hurt_boxes = '<div class="hurtBoxHead"></div><div class="hurtBoxTorso"></div><div class="hurtBoxLegs"></div>';
        if(level>0) sprtFrm = $('<div class="character"><div class="'+sprite+' '+aniName+level+'-'+a+'">'+hit_box+hurt_boxes+'</div></div>');
        else sprtFrm = $('<div class="character"><div class="'+sprite+' '+aniName+'-'+a+'">'+hit_box+hurt_boxes+'</div></div>');
        $('.frameWindow .frames').append(sprtFrm);
        if(a==1) sprtFrm.show();
        else sprtFrm.hide();
      }
    }
  };

  var newPositionLeft = function(){
    var lft = plyr.css('left').substr(0,plyr.css('left').indexOf('px')), newLft = lft; // newLft-"Numerical width value of player relative to position from left."
    // Calculate the width of the player box through the animation.
    if(aniName == 'moveLft' || aniName == 'moveUpLft'){
      newLft = Number(lft)-shift;
      if(newLft < 0){
        newLft = 0;
      }
    }
    else if(aniName == 'moveRht' || aniName == 'moveUpRht'){
      newLft = Number(lft)+shift;
      if(newLft > Number(stage_width-sprt_width)){
        newLft = Number(stage_width-sprt_width);
      }
    }
    else if(aniShft == true && nxtFrm >= aniShftStartFrm && nxtFrm < aniShftEndFrm+1){
      if(side == 'Lft'){
        newLft = Number(newLft)+Number(aniShftPixAmt);
      }
      else if(side == 'Rht'){
        newLft = Number(newLft)-Number(aniShftPixAmt);
      }
      if(newLft < 0){
        newLft = 0;
      }
      else if(newLft > Number(stage_width-sprt_width)){
        newLft = Number(stage_width-sprt_width);
      }
    }
    return newLft;
  };

  plyr.css('bottom', posBtm+'px').css('left',posLft+'px');
  if(animations[player] == undefined) animations[player] = new Array;
  if(animations[player][sprite] == undefined) animations[player][sprite]=null;
  if(animationClosers[player] == undefined) animationClosers[player] = new Array;
  if(animationClosers[player][sprite] == undefined) animationClosers[player][sprite]=null;
  if(e != undefined && (e.type == 'click' || e.type == 'keydown' || e.type == 'mousedown') && plyr.hasClass(aniName) == false){
    // todo: if hit, animation must be broken and appropriate hit animation needs to be started.
    if(plyr.attr('class').split(' ').length == 1){
      loadFrames(player, sprite, aniName, level, frms);
      // Initializing event animation
      plyr.addClass(aniName);
      self.clearInterval(animations[player][sprite]);
      var sprtClss;
      if(level > 0) sprtClss = aniName+level+'-'+prvFrm
      else sprtClss = aniName+'-'+prvFrm;
      sprt.attr('class', sprite+' '+sprtClss);
      animations[player][sprite] = self.setInterval(function(){
        collisionDetection(thePlayer);
        // Cycle through the animation
        if(prvFrm != nxtFrm){
          if(sprt.hasClass(sprtClss)){
            sprt.removeClass(sprtClss);
          }
          newLft = newPositionLeft();
          // Adjust the animation as calculated above.
          thePlayer.position.left = newLft;
          plyr.css('left',newLft+'px');
          if(level > 0) sprtClss = aniName+level+'-'+nxtFrm
          else sprtClss = aniName+'-'+nxtFrm;
          sprt.addClass(sprtClss);
          prvFrm = nxtFrm;
          nxtFrm++;
          // Adjust the animation depending on certain state conditions.
          if(nxtFrm > frms){
            if(loop == false){
              if(attck == true){
                plyr.removeClass(aniName);
                self.clearInterval(animations[player][sprite]);
                self.clearInterval(animationClosers[player][sprite]);
                animate(player,sprite,'idle',0,undefined);
              }
              else nxtFrm = prvFrm;
            }
            else nxtFrm = 1;
          }
          else if(attck && cp && prvFrm == cpf){
            // At this point in the animation a projectile needs to be created.
            createProjectile(player, sprite, aniName, level, e);
          }
        }
      }, rnTm/frms);
    }
    else {
//      thePlayer.queue.aniName = aniName;
//      thePlayer.queue.e = e;
    }
  }
  else if(e != undefined && (e.type == 'keyup' || e.type == 'mouseup') && plyr.hasClass(aniName) == true){
    if(loop == true){
      // Sets the animation that follows the release of a press and hold animation.
      animationClosers[player][sprite] = self.setInterval(function(){
        collisionDetection(thePlayer);
        if(sprt.hasClass(aniName+'-'+frms)){
          plyr.removeClass(aniName);
          self.clearInterval(animations[player][sprite]);
          self.clearInterval(animationClosers[player][sprite]);
          if(thePlayer.queue.aniName != null && thePlayer.queue.e != null){
            animate(player,sprite,thePlayer.queue.aniName,0,thePlayer.queue.e);
            thePlayer.queue.aniName = thePlayer.queue.e = null;
          }
          else animate(player,sprite,'idle',0,undefined);
        }
      },rnTm/frms);
    }
    else{
      // Resets the idle animation after a press and hold animation release animation has ended.
      loadFrames(player, sprite, aniName, level, frms);
      plyr.removeClass(aniName);
      self.clearInterval(animations[player][sprite]);
      var aniClass = sprt.attr('class').replace(sprite,'').trim();
      prvFrm = aniClass.substr(aniClass.lastIndexOf('-')+1);
      nxtFrm = prvFrm-1;
      animations[player][sprite] = self.setInterval(function(){
        collisionDetection(thePlayer);
        if(sprt.hasClass(aniName+'-'+prvFrm)){
          sprt.removeClass(aniName+'-'+prvFrm);
        }
        newLft = newPositionLeft();
        thePlayer.position.left = newLft;
        plyr.css('left',newLft+'px');
        sprt.addClass(aniName+'-'+nxtFrm);
        prvFrm = nxtFrm;
        nxtFrm--;
        if(nxtFrm < 1){
          self.clearInterval(animations[player][sprite]);
          animate(player, sprite, 'idle', 0, undefined);
        }
      },rnTm/frms);
    }
  }
  else if(e == undefined){
    // Sets the idle animation
    //loadFrames(player, sprite, aniName, level, frms);
    sprt.attr('class', sprite+' '+aniName+'-'+nxtFrm);
    animations[player][sprite] = self.setInterval(function(){
      var damageDetected = collisionDetection(thePlayer);
      if(damageDetected>0){
        console.log(damageDetected);
        thePlayer.hit = true;
        self.clearInterval(animations[player][sprite]);
        phasedOut = self.setInterval(function(){
          self.clearInterval(phasedOut);
          thePlayer.hit = false;
          animate(player, sprite, 'idle', 0, undefined);
        }, 250);
      }
      if(sprt.hasClass(aniName+'-'+prvFrm)){
        sprt.removeClass(aniName+'-'+prvFrm);
      }
      newLft = newPositionLeft();
      thePlayer.position.left = newLft;
      plyr.css('left',newLft+'px');
      sprt.addClass(aniName+'-'+nxtFrm);
      prvFrm = nxtFrm;
      nxtFrm++;
      if(nxtFrm > frms){
        if(theAnimation.loop != undefined && theAnimation.loop == false ||
          e != undefined && e.type != theAnimation.eType){
          self.clearInterval(animations[player][sprite]);
          animate(player, sprite, 'idle', 0, undefined);
        }
        else{
          nxtFrm = 1;
        }
      }
    },rnTm/frms);
  }
  else{
    //console.log([player,sprite,aniName,level,e.type]);
  }
};

var createProjectile = function(player, sprite, aniName, level, e){
  var thePlayer = players[player];
  var theProjectile = thePlayer.projectile[level];
  var attck = theProjectile.attack;
  var creation_tm = new Date().getTime();
  var frms = theProjectile.frames;
  var loop = theProjectile.loop;
  var plyr = $('#player-'+player);
  var posBtm = thePlayer.position.bottom;
  var posLft = thePlayer.position.left;
  var prvFrm = 1, nxtFrm = prvFrm+1;
  var rnTm = Number(theProjectile.runTime)*1000;
  var selfAnimation;
  var side = thePlayer.side;
  var sprt = plyr.children('.'+sprite);
  var this_projectile = $('<div player="'+player+'" id="player-'+player+'-projectile'+level+'-'+creation_tm+'" class="'+sprite+' projectile'+level+'" />');
  var this_prjctl_sprt = $('<div class="projectile'+level+'-1"><div class="hitBox"></div></div>');
  var sprt_width = Number(sprt.css('width').substr(0,sprt.css('width').indexOf('px')).valueOf());
  var stage_width = Number($('#stage').css('width').substr(0, Number($('#stage').css('width').indexOf('px'))));
  var shift = Math.ceil(sprt_width/frms);
  this_projectile.append(this_prjctl_sprt);
  this_projectile.appendTo('#stage');
  this_projectile.css('bottom', Number(plyr.css('bottom').substr(0, Number(plyr.css('bottom').indexOf('px'))))+55);
  this_projectile.css('left', Number(plyr.css('left').substr(0, Number(plyr.css('left').indexOf('px'))))+Number(sprt.css('width').substr(0, Number(sprt.css('width').indexOf('px')))));
  selfAnimation = self.setInterval(function(){
    if(this_prjctl_sprt.hasClass('projectile'+level+'-'+prvFrm)){
      this_prjctl_sprt.removeClass('projectile'+level+'-'+prvFrm);
    }
    this_prjctl_sprt.addClass('projectile'+level+'-'+nxtFrm);
    //hit_box = this_prjctl_sprt.children('.hitBox').first();
    prvFrm = nxtFrm;
    nxtFrm++;
    if(prvFrm%2==0){
      var this_left = Number(this_projectile.css('left').substr(0, Number(this_projectile.css('left').indexOf('px'))))+10;
      this_projectile.css('left', this_left);
      if(this_left > stage_width){
        this_projectile.remove();
        self.clearInterval(selfAnimation);
      }
    }
    if(nxtFrm > frms){
      nxtFrm = 1;
    }
  },rnTm/frms);
};

// Keyboard events
$(document).on('keydown', function(e){
  switch (e.keyCode){
    case 81: // q
      animate(1,'Ryu','moveUpLft',0,e);
      break;
    case 87: // w
      animate(1,'Ryu','moveUp',0,e);
      break;
    case 69: // e
      animate(1,'Ryu','moveUpRht',0,e);
      break;
    case 65: // a
      animate(1,'Ryu','moveLft',0,e);
      break;
    case 83: // s
      animate(1,'Ryu','moveDwn',0,e);
      break;
    case 68: // d
      animate(1,'Ryu','moveRht',0,e);
      break;
  }
});
$(document).on('keyup', function(e){
  switch (e.keyCode){
    case 81: // q
      animate(1,'Ryu','moveUpLft',0,e);
      break;
    case 87: // w
      animate(1,'Ryu','moveUp',0,e);
      break;
    case 69: // e
      animate(1,'Ryu','moveUpRht',0,e);
      break;
    case 65: // a
      animate(1,'Ryu','moveLft',0,e);
      break;
    case 83: // s
      animate(1,'Ryu','moveDwn',0,e);
      break;
    case 68: // d
      animate(1,'Ryu','moveRht',0,e);
      break;
  }
});

// Mouse click events, movement
$(document).on('mousedown', '#btnDwn', function(e){e.keyCode = 83;animate(1,'Ryu','moveDwn',0,e);});
$(document).on('mouseup', '#btnDwn', function(e){e.keyCode = 83;animate(1,'Ryu','moveDwn',0,e);});
$(document).on('mousedown', '#btnLft', function(e){e.keyCode = 65;animate(1,'Ryu','moveLft',0,e);});
$(document).on('mouseup', '#btnLft', function(e){e.keyCode = 65;animate(1,'Ryu','moveLft',0,e);});
$(document).on('mousedown', '#btnRht', function(e){e.keyCode = 68;animate(1,'Ryu','moveRht',0,e);});
$(document).on('mouseup', '#btnRht', function(e){e.keyCode = 68;animate(1,'Ryu','moveRht',0,e);});
$(document).on('mousedown', '#btnUp', function(e){e.keyCode = 87;animate(1,'Ryu','moveUp',0,e);});
$(document).on('mouseup', '#btnUp', function(e){e.keyCode = 87;animate(1,'Ryu','moveUp',0,e);});
$(document).on('mousedown', '#btnUpLft', function(e){e.keyCode = 81;animate(1,'Ryu','moveUpLft',0,e);});
$(document).on('mouseup', '#btnUpLft', function(e){e.keyCode = 81;animate(1,'Ryu','moveUpLft',0,e);});
$(document).on('mousedown', '#btnUpRht', function(e){e.keyCode = 69;animate(1,'Ryu','moveUpRht',0,e);});
$(document).on('mouseup', '#btnUpRht', function(e){e.keyCode = 69;animate(1,'Ryu','moveUpRht',0,e);});

// Mouse click events, attacks
$('#btnHaduken1').on('click', function(e){animate(1,'Ryu','haduken',1,e);});
$('#btnHaduken2').on('click', function(e){animate(1,'Ryu','haduken',2,e);});
$('#btnHaduken3').on('click', function(e){animate(1,'Ryu','haduken',3,e);});
$('#btnHurricaneKick1').on('click', function(e){animate(1,'Ryu','hurricaneKick',1,e);});
$('#btnHurricaneKick2').on('click', function(e){animate(1,'Ryu','hurricaneKick',2,e);});
$('#btnHurricaneKick3').on('click', function(e){animate(1,'Ryu','hurricaneKick',3,e);});
$('#btnShoryuken1').on('click', function(e){animate(1,'Ryu','shoryuken',1,e);});
$('#btnShoryuken2').on('click', function(e){animate(1,'Ryu','shoryuken',2,e);});
$('#btnShoryuken3').on('click', function(e){animate(1,'Ryu','shoryuken',3,e);});
$('#btnPunch1').on('click', function(e){animate(1,'Ryu','punch',1,e);});
$('#btnPunch2').on('click', function(e){animate(1,'Ryu','punch',2,e);});
$('#btnPunch3').on('click', function(e){animate(1,'Ryu','punch',3,e);});
$('#btnKick1').on('click', function(e){animate(1,'Ryu','kick',1,e);});
$('#btnKick2').on('click', function(e){animate(1,'Ryu','kick',2,e);});
$('#btnKick3').on('click', function(e){animate(1,'Ryu','kick',3,e);});
$('#btnGrapplePunch1').on('click', function(e){animate(1,'Ryu','grapplePunch',1,e);});
$('#btnGrappleKick1').on('click', function(e){animate(1,'Ryu','grappleKick',1,e);});

// Game engine initializer
$(document).ready(function(){
  players[1] = Player;
  players[1].init(1,'Ryu');
  players[2] = clone(players[1]);
  players[2].player = 2;
  players[2].position.left = 500;
  players[2].side = 'Rht';

  animate(1,'Ryu','combatReady',0,undefined);
  animate(2,'Ryu','combatReady',0,undefined);
  var cR = setInterval(function(){
    clockCountDown = setInterval(function(){
      var toc = Number($('#clock div h3').text());
      if(toc>0){
        toc--;
      }
      else{
        clearInterval(clockCountDown);
      }
      $('#clock div h3').text(toc);
      if(toc<10){
        $('.clock div').css('width', '10px');
      }
    },1000);
    clearInterval(cR);
  },2249);
});

$('#frameByFrame .toggles .next').on('click', function(e){
  var done = false;
  var frms = $('#frameByFrame .frameWindow .frames').children('div');
  for(var a=0; a<frms.length; a++){
    if(done == true){
      $(frms[a]).css('display', '');
      break;
    }
    if($(frms[a]).css('display') != 'none'){
      if(a+1 != frms.length){
        $(frms[a]).css('display', 'none');
        done = true;
      }
    }
  }
});

$('#frameByFrame .toggles .prev').on('click', function(e){
  var done = false;
  var frms = $('#frameByFrame .frameWindow .frames').children('div');
  for(var a=(frms.length-1); a>-1; a--){
    if(done == true){
      $(frms[a]).css('display', '');
      break;
    }
    if($(frms[a]).css('display') != 'none'){
      if(a != 0){
        $(frms[a]).css('display', 'none');
        done = true;
      }
    }
  }
});
