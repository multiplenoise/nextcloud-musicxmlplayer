<?php

declare(strict_types=1);

namespace OCA\MusicXMLPlayer\Listener;

use \OCA\Files\Event\LoadAdditionalScriptsEvent;
use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;

class LoadAdditionalScriptsListener implements IEventListener {

	public function handle(Event $event): void {
		if (!($event instanceof LoadAdditionalScriptsEvent)) {
            // Unrelated
            return;
		}
		\OCP\Util::addScript('musicxmlplayer', 'alphaTab-1.8.0.min');
		\OCP\Util::addScript('musicxmlplayer', 'musicxmlplayer');
		\OCP\Util::addStyle('musicxmlplayer', 'musicxmlplayer');
		\OCP\Util::addStyle('musicxmlplayer', 'bootstrap-icons.min');
	}

}
