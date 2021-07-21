<?php

declare(strict_types=1);

namespace OCA\MusicXMLPlayer\Listener;

use OCP\AppFramework\Http\EmptyContentSecurityPolicy;
use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;
use OCP\Security\CSP\AddContentSecurityPolicyEvent;

class CSPListener implements IEventListener {
	public function handle(Event $event): void {
		if (!$event instanceof AddContentSecurityPolicyEvent) {
			return;
		}

		$policy = new EmptyContentSecurityPolicy();
		$policy->addAllowedWorkerSrcDomain('\'self\'');
		$policy->addAllowedWorkerSrcDomain('blob:');
		$policy->addAllowedScriptDomain('*');
		$event->addPolicy($policy);
	}
}
