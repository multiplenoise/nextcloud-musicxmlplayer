<?php

declare(strict_types=1);

namespace OCA\MusicXMLPlayer\Controller;

use OCP\IRequest;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\StreamResponse;

use function OCP\Log\logger;

class FilesController extends Controller {

    public function __construct(string $appName, IRequest $request) {
        parent::__construct($appName, $request);
    }


    /**
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function getSoundfont(): StreamResponse {
        return new StreamResponse(join(DIRECTORY_SEPARATOR, [dirname(__FILE__), '..', '..', 'files', 'sonivox.sf2']));
    }

    /**
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function getWrapper(): StreamResponse {
        return new StreamResponse(join(DIRECTORY_SEPARATOR, [dirname(__FILE__), '..', '..', 'files', 'wrapper.html']));
    }
}