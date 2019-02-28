import { Ray, Vector3 } from '../lib/yuka.module.js';
import { Weapon } from './Weapon.js';
import { CONFIG } from '../core/Config.js';
import { WEAPON_STATUS_READY, WEAPON_STATUS_SHOT, WEAPON_STATUS_RELOAD, WEAPON_STATUS_EMPTY, WEAPON_STATUS_OUT_OF_AMMO } from '../core/Constants.js';

const spread = new Vector3();

/**
* Class for representing a shotgun.
*
* @author {@link https://github.com/Mugen87|Mugen87}
*/
class Shotgun extends Weapon {

	/**
	* Constructs a new shotgun with the given values.
	*
	* @param {GameEntity} owner - The owner of this weapon.
	*/
	constructor( owner ) {

		super( owner );

		this.roundsLeft = CONFIG.SHOTGUN.ROUNDS_LEFT;
		this.roundsPerClip = CONFIG.SHOTGUN.ROUNDS_PER_CLIP;
		this.ammo = CONFIG.SHOTGUN.AMMO;
		this.maxAmmo = CONFIG.SHOTGUN.MAX_AMMO;

		this.shotTime = CONFIG.SHOTGUN.SHOT_TIME;
		this.reloadTime = CONFIG.SHOTGUN.RELOAD_TIME;

		// shotgun specific properties

		this.bulletsPerShot = CONFIG.SHOTGUN.BULLETS_PER_SHOT;
		this.spread = CONFIG.SHOTGUN.SPREAD;

		this.shotReloadTime = CONFIG.SHOTGUN.SHOT_RELOAD_TIME;
		this.endTimeShotReload = Infinity;

		this.muzzleFireTime = CONFIG.BLASTER.MUZZLE_TIME;
		this.endTimeMuzzleFire = Infinity;

		// render specific stuff

		this.muzzle = null;
		this.audios = null;

	}

	/**
	* Update method of this weapon.
	*
	* @param {Number} delta - The time delta value;
	* @return {Shotgun} A reference to this weapon.
	*/
	update( delta ) {

		super.update( delta );

		// check reload after each shot

		if ( this.currentTime >= this.endTimeShotReload ) {

			const audio = this.audios.get( 'shot_reload' );
			if ( audio.isPlaying === true ) audio.stop();
			audio.play();

			this.endTimeShotReload = Infinity;

		}

		// check reload of clip

		if ( this.currentTime >= this.endTimeReload ) {

			const toReload = this.roundsPerClip - this.roundsLeft;

			if ( this.ammo >= toReload ) {

				this.roundsLeft = this.roundsPerClip;
				this.ammo -= toReload;

			} else {

				this.roundsLeft += this.ammo;
				this.ammo = 0;

			}

			this.status = WEAPON_STATUS_READY;

			this.endTimeReload = Infinity;

		}

		// check muzzle fire

		if ( this.currentTime >= this.endTimeMuzzleFire ) {

			this.muzzle.visible = false;

			this.endTimeMuzzleFire = Infinity;

		}

		// check shoot

		if ( this.currentTime >= this.endTimeShot ) {

			if ( this.roundsLeft === 0 ) {

				if ( this.ammo === 0 ) {

					this.status = WEAPON_STATUS_OUT_OF_AMMO;

				} else {

					this.status = WEAPON_STATUS_EMPTY;

				}

			} else {

				this.status = WEAPON_STATUS_READY;

			}

			this.endTimeShot = Infinity;

		}

		return this;

	}

	/**
	* Reloads the weapon.
	*
	* @return {Shotgun} A reference to this weapon.
	*/
	reload() {

		this.status = WEAPON_STATUS_RELOAD;

		const audio = this.audios.get( 'reload' );
		if ( audio.isPlaying === true ) audio.stop();
		audio.play();

		this.endTimeReload = this.currentTime + this.reloadTime;

		return this;

	}

	/**
	* Shoots at the given position.
	*
	* @param {Vector3} targetPosition - The target position.
	* @return {Blaster} A reference to this weapon.
	*/
	shoot( targetPosition ) {

		this.status = WEAPON_STATUS_SHOT;

		// audio

		const audio = this.audios.get( 'shot' );
		if ( audio.isPlaying === true ) audio.stop();
		audio.play();

		// muzzle fire

		this.muzzle.visible = true;
		this.muzzle.material.rotation = Math.random() * Math.PI;

		this.endTimeMuzzleFire = this.currentTime + this.muzzleFireTime;

		// create bullets

		const ray = new Ray();

		this.getWorldPosition( ray.origin );
		ray.direction.subVectors( targetPosition, ray.origin ).normalize();

		for ( let i = 0; i < this.bulletsPerShot; i ++ ) {

			const r = ray.clone();

			spread.x = ( 1 - Math.random() * 2 ) * this.spread;
			spread.y = ( 1 - Math.random() * 2 ) * this.spread;
			spread.z = ( 1 - Math.random() * 2 ) * this.spread;

			r.direction.add( spread ).normalize();

			this.owner.world.addBullet( this.owner, r );

		}

		// adjust ammo

		this.roundsLeft --;

		this.endTimeShotReload = this.currentTime + this.shotReloadTime;
		this.endTimeShot = this.currentTime + this.shotTime;

		return this;

	}

}

export { Shotgun };