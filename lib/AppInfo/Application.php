<?php

declare(strict_types=1);

namespace OCA\MusicXMLPlayer\AppInfo;

use OCA\MusicXMLPlayer\Listener\LoadAdditionalScriptsListener;
use OCA\MusicXMLPlayer\Listener\CSPListener;

use OCP\AppFramework\App;
use OCP\AppFramework\Bootstrap\IBootContext;
use OCP\AppFramework\Bootstrap\IBootstrap;
use OCP\AppFramework\Bootstrap\IRegistrationContext;
use OCA\Files\Event\LoadAdditionalScriptsEvent;
use OCP\Security\CSP\AddContentSecurityPolicyEvent;

class Application extends App implements IBootstrap {
    public const APP_ID = 'musicxmlplayer';

    public function __construct() {
        parent::__construct(self::APP_ID);
    }

	public function register(IRegistrationContext $context): void {
        $context->registerEventListener(LoadAdditionalScriptsEvent::class, LoadAdditionalScriptsListener::class);
        $context->registerEventListener(AddContentSecurityPolicyEvent::class, CSPListener::class);
    }

	public function boot(IBootContext $context): void {
	}
}
