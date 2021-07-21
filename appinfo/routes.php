<?php

declare(strict_types=1);

namespace OCA\MusicXMLPlayer\AppInfo;

return [
	'routes' => [
		[
			'name' => 'Files#getSoundfont',
			'url' => '/sonivox.sf2',
			'verb' => 'GET'
		],
		[
			'name' => 'Files#getWrapper',
			'url' => '/wrapper.html',
			'verb' => 'GET'
		]
	]
];