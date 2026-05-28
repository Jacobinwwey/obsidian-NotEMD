import { requestUrl } from 'obsidian';
import { discoverProviderModels, discoverProviderModelsDetailed } from '../providerModelDiscovery';

jest.mock('obsidian');

describe('provider model discovery', () => {
    const mockedRequestUrl = requestUrl as jest.MockedFunction<typeof requestUrl>;

    beforeEach(() => {
        mockedRequestUrl.mockReset();
    });

    test('discovers models from OpenAI-compatible providers via /models', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                data: [
                    { id: 'gpt-4o' },
                    { id: 'gpt-4.1' },
                    { id: 'gpt-4o' }
                ]
            }
        } as any);

        const result = await discoverProviderModels({
            name: 'OpenAI',
            apiKey: 'sk-test',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4o',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://api.openai.com/v1/models',
            method: 'GET'
        }));
        expect(result).toEqual({
            models: ['gpt-4.1', 'gpt-4o'],
            source: 'remote'
        });
    });

    test('merges bounded paginated OpenAI-compatible /models catalogs through next links', async () => {
        mockedRequestUrl
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    data: [
                        { id: 'gpt-4.1' },
                        { id: 'text-embedding-3-large', supported_endpoint_types: ['embedding'] }
                    ],
                    next_url: '?cursor=page-2'
                }
            } as any)
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    rows: [
                        { provider_model_id: 'claude-sonnet-4-20250514', type: 'language' },
                        { uid: 'gpt-4.1' }
                    ]
                }
            } as any);

        const result = await discoverProviderModels({
            name: 'OpenAI Compatible',
            apiKey: 'sk-test',
            baseUrl: 'https://custom-openai-compatible.example/v1',
            model: 'gpt-4.1',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenNthCalledWith(1, expect.objectContaining({
            url: 'https://custom-openai-compatible.example/v1/models',
            method: 'GET'
        }));
        expect(mockedRequestUrl).toHaveBeenNthCalledWith(2, expect.objectContaining({
            url: 'https://custom-openai-compatible.example/v1/models?cursor=page-2',
            method: 'GET'
        }));
        expect(result).toEqual({
            models: ['claude-sonnet-4-20250514', 'gpt-4.1'],
            source: 'remote'
        });
    });

    test('keeps the first page of a bounded OpenAI-compatible model catalog when a later page fails', async () => {
        mockedRequestUrl
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    value: [
                        { identifier: 'gpt-4.1' },
                        { modelId: 'qwen3-coder-plus', supported_endpoint_types: ['chat'] }
                    ],
                    nextPageToken: 'page-2-token'
                }
            } as any)
            .mockRejectedValueOnce(new Error('page 2 unavailable'));

        const result = await discoverProviderModelsDetailed({
            name: 'OpenAI Compatible',
            apiKey: 'sk-test',
            baseUrl: 'https://custom-openai-compatible.example/v1',
            model: 'gpt-4.1',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenNthCalledWith(1, expect.objectContaining({
            url: 'https://custom-openai-compatible.example/v1/models',
            method: 'GET'
        }));
        expect(mockedRequestUrl).toHaveBeenNthCalledWith(2, expect.objectContaining({
            url: 'https://custom-openai-compatible.example/v1/models?pageToken=page-2-token',
            method: 'GET'
        }));
        expect(result).toEqual({
            models: ['gpt-4.1', 'qwen3-coder-plus'],
            entries: [
                { id: 'gpt-4.1' },
                { id: 'qwen3-coder-plus' }
            ],
            source: 'remote'
        });
    });

    test('follows nested pagination metadata that exposes continuationToken and meta.next objects', async () => {
        mockedRequestUrl
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    data: {
                        models: [
                            { id: 'gpt-4.1' },
                            { id: 'text-embedding-3-large', supported_endpoint_types: ['embedding'] }
                        ]
                    },
                    meta: {
                        next: {
                            href: '?continuationToken=page-2'
                        }
                    }
                }
            } as any)
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    result: {
                        items: [
                            { id: 'claude-sonnet-4-20250514', endpointType: 'chat' },
                            { id: 'text-embedding-3-large', endpointType: 'embeddings' }
                        ]
                    }
                }
            } as any);

        const result = await discoverProviderModels({
            name: 'OpenAI Compatible',
            apiKey: 'sk-test',
            baseUrl: 'https://custom-openai-compatible.example/v1',
            model: 'gpt-4.1',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenNthCalledWith(1, expect.objectContaining({
            url: 'https://custom-openai-compatible.example/v1/models',
            method: 'GET'
        }));
        expect(mockedRequestUrl).toHaveBeenNthCalledWith(2, expect.objectContaining({
            url: 'https://custom-openai-compatible.example/v1/models?continuationToken=page-2',
            method: 'GET'
        }));
        expect(result).toEqual({
            models: ['claude-sonnet-4-20250514', 'gpt-4.1'],
            source: 'remote'
        });
    });

    test('follows broader pagination hints such as nextPageUrl fields and preserves after_id semantics', async () => {
        mockedRequestUrl
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    data: [
                        { id: 'claude-sonnet-4-20250514' }
                    ],
                    meta: {
                        nextPageUrl: '?after_id=claude-sonnet-4-5-20250929'
                    }
                }
            } as any)
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    data: [
                        { id: 'claude-sonnet-4-5-20250929' }
                    ]
                }
            } as any);

        const result = await discoverProviderModels({
            name: 'OpenAI Compatible',
            apiKey: 'sk-test',
            baseUrl: 'https://custom-openai-compatible.example/v1',
            model: 'claude-sonnet-4-20250514',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenNthCalledWith(2, expect.objectContaining({
            url: 'https://custom-openai-compatible.example/v1/models?after_id=claude-sonnet-4-5-20250929',
            method: 'GET'
        }));
        expect(result).toEqual({
            models: ['claude-sonnet-4-20250514', 'claude-sonnet-4-5-20250929'],
            source: 'remote'
        });
    });

    test('preserves transient discovery metadata such as labels and max output tokens in the detailed result', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                data: [
                    {
                        id: 'gpt-4.1',
                        name: 'GPT-4.1',
                        owned_by: 'openai',
                        max_output_tokens: 32768
                    },
                    {
                        id: 'text-embedding-3-large',
                        name: 'Text Embedding 3 Large',
                        supported_endpoint_types: ['embeddings']
                    }
                ]
            }
        } as any);

        const result = await discoverProviderModelsDetailed({
            name: 'OpenAI Compatible',
            apiKey: 'sk-test',
            baseUrl: 'https://custom-openai-compatible.example/v1',
            model: 'gpt-4.1',
            temperature: 0.5
        });

        expect(result).toEqual({
            models: ['gpt-4.1'],
            entries: [
                {
                    id: 'gpt-4.1',
                    label: 'GPT-4.1',
                    ownerHint: 'openai',
                    maxOutputTokens: 32768
                }
            ],
            source: 'remote'
        });
    });

    test('preserves owner/provider hints from broader registry fields and keeps the first non-empty hint per model id', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                data: [
                    {
                        id: 'gpt-4.1',
                        name: 'GPT-4.1',
                        owned_by: 'openai',
                        max_output_tokens: 32768
                    },
                    {
                        id: 'gpt-4.1',
                        provider: 'OpenAI',
                        organization: 'OpenAI'
                    },
                    {
                        id: 'qwen/qwen3.7-max',
                        display_name: 'Qwen3.7 Max',
                        specification: {
                            provider: 'alibaba'
                        }
                    },
                    {
                        id: 'text-embedding-3-large',
                        publisher: 'openai',
                        supported_output_modalities: ['embedding']
                    }
                ]
            }
        } as any);

        const result = await discoverProviderModelsDetailed({
            name: 'OpenAI Compatible',
            apiKey: 'sk-test',
            baseUrl: 'https://custom-openai-compatible.example/v1',
            model: 'gpt-4.1',
            temperature: 0.5
        });

        expect(result).toEqual({
            models: ['gpt-4.1', 'qwen/qwen3.7-max'],
            entries: [
                {
                    id: 'gpt-4.1',
                    label: 'GPT-4.1',
                    ownerHint: 'openai',
                    maxOutputTokens: 32768
                },
                {
                    id: 'qwen/qwen3.7-max',
                    label: 'Qwen3.7 Max',
                    ownerHint: 'alibaba'
                }
            ],
            source: 'remote'
        });
    });

    test('extracts max output token hints from real hosted registry fields such as top_provider and limits objects', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                data: [
                    {
                        id: 'qwen/qwen3.7-max',
                        name: 'Qwen: Qwen3.7 Max',
                        architecture: {
                            modality: 'text->text',
                            output_modalities: ['text']
                        },
                        top_provider: {
                            max_completion_tokens: 65536
                        }
                    },
                    {
                        id: 'openai/gpt-4.1',
                        name: 'OpenAI GPT-4.1',
                        supported_output_modalities: ['text'],
                        limits: {
                            max_output_tokens: 32768
                        }
                    },
                    {
                        id: 'text-embedding-3-large',
                        limits: {
                            max_output_tokens: 8192
                        },
                        supported_output_modalities: ['embedding']
                    }
                ]
            }
        } as any);

        const result = await discoverProviderModelsDetailed({
            name: 'OpenAI Compatible',
            apiKey: 'sk-test',
            baseUrl: 'https://custom-openai-compatible.example/v1',
            model: 'qwen/qwen3.7-max',
            temperature: 0.5
        });

        expect(result).toEqual({
            models: ['openai/gpt-4.1', 'qwen/qwen3.7-max'],
            entries: [
                {
                    id: 'openai/gpt-4.1',
                    label: 'OpenAI GPT-4.1',
                    maxOutputTokens: 32768
                },
                {
                    id: 'qwen/qwen3.7-max',
                    label: 'Qwen: Qwen3.7 Max',
                    maxOutputTokens: 65536
                }
            ],
            source: 'remote'
        });
    });

    test('filters non-text or unavailable models using richer capability, modality, and availability metadata', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                data: [
                    {
                        id: 'qwen3-coder-plus',
                        display_name: 'Qwen3 Coder Plus',
                        tasks: 'chat,reasoning',
                        output_modalities: 'text',
                        capabilities: {
                            tool_use: true
                        },
                        max_output: 65536
                    },
                    {
                        id: 'visioncraft-studio',
                        tasks: 'image_generation',
                        output_modalities: 'image'
                    },
                    {
                        id: 'cartesia-ultra',
                        features: 'speech_synthesis,audio',
                        output_modalities: ['audio']
                    },
                    {
                        id: 'legacy-text-model',
                        tasks: 'chat',
                        output_modalities: 'text',
                        status: 'deprecated'
                    },
                    {
                        id: 'disabled-assistant-model',
                        tasks: 'chat',
                        output_modalities: 'text',
                        active: false
                    }
                ]
            }
        } as any);

        const result = await discoverProviderModelsDetailed({
            name: 'OpenAI Compatible',
            apiKey: 'sk-test',
            baseUrl: 'https://custom-openai-compatible.example/v1',
            model: 'qwen3-coder-plus',
            temperature: 0.5
        });

        expect(result).toEqual({
            models: ['qwen3-coder-plus'],
            entries: [
                {
                    id: 'qwen3-coder-plus',
                    label: 'Qwen3 Coder Plus',
                    maxOutputTokens: 65536
                }
            ],
            source: 'remote'
        });
    });

    test('keeps text-generation models while filtering audio and image catalogs from broader Together-style registries', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: [
                {
                    id: 'cartesia/ultra',
                    display_name: 'Cartesia Ultra',
                    tasks: 'speech_synthesis',
                    output_modalities: 'audio'
                },
                {
                    id: 'google/visioncraft',
                    display_name: 'Visioncraft',
                    tasks: 'image_generation',
                    output_modalities: 'image'
                },
                {
                    id: 'moonshotai/kimi-k2.5',
                    display_name: 'Kimi K2.5',
                    tasks: 'chat,reasoning',
                    output_modalities: 'text'
                }
            ]
        } as any);

        const result = await discoverProviderModels({
            name: 'Together',
            apiKey: 'together-key',
            baseUrl: 'https://api.together.xyz/v1',
            model: 'moonshotai/kimi-k2.5',
            temperature: 0.5
        });

        expect(result).toEqual({
            models: ['moonshotai/kimi-k2.5'],
            source: 'remote'
        });
    });

    test('routes generic OpenAI-compatible OpenRouter endpoints through the bounded chat and embedding catalog merge', async () => {
        mockedRequestUrl
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    data: [
                        { id: 'anthropic/claude-sonnet-4.5' },
                        { id: 'openai/gpt-4.1' }
                    ]
                }
            } as any)
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    data: [
                        { id: 'openai/text-embedding-3-large' }
                    ]
                }
            } as any);

        const result = await discoverProviderModels({
            name: 'OpenAI Compatible',
            apiKey: 'router-key',
            baseUrl: 'https://openrouter.ai/api/v1',
            model: 'anthropic/claude-sonnet-4.5',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenNthCalledWith(1, expect.objectContaining({
            url: 'https://openrouter.ai/api/v1/models',
            headers: expect.objectContaining({
                Authorization: 'Bearer router-key',
                'HTTP-Referer': 'https://github.com/Jacobinwwey/obsidian-NotEMD',
                'X-Title': 'Notemd Obsidian Plugin'
            })
        }));
        expect(mockedRequestUrl).toHaveBeenNthCalledWith(2, expect.objectContaining({
            url: 'https://openrouter.ai/api/v1/embeddings/models'
        }));
        expect(result).toEqual({
            models: ['anthropic/claude-sonnet-4.5', 'openai/gpt-4.1'],
            source: 'remote'
        });
    });

    test('routes generic OpenAI-compatible AIHubMix endpoints through the dedicated hosted registry', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                data: [
                    { model_id: 'openai/gpt-4.1', model_name: 'GPT-4.1' },
                    { model_id: 'deepseek/deepseek-r1', model_name: 'DeepSeek R1' },
                    { model_id: 'text-embedding-3-large', model_name: 'Text Embedding 3 Large', endpoints: 'embedding' }
                ]
            }
        } as any);

        const result = await discoverProviderModels({
            name: 'OpenAI Compatible',
            apiKey: 'aihubmix-key',
            baseUrl: 'https://aihubmix.com/v1',
            model: 'openai/gpt-4.1',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://aihubmix.com/api/v1/models?type=llm',
            method: 'GET',
            headers: expect.objectContaining({
                Authorization: 'Bearer aihubmix-key',
                'X-Api-Key': 'aihubmix-key',
                'APP-Code': 'MLTG2087'
            })
        }));
        expect(result).toEqual({
            models: ['deepseek/deepseek-r1', 'openai/gpt-4.1'],
            source: 'remote'
        });
    });

    test('filters broader AIHubMix registries using hosted types metadata so non-generation rows do not crowd the picker', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                data: [
                    {
                        model_id: 'qwen3.6-plus',
                        model_name: 'Qwen3.6 Plus',
                        types: 'llm',
                        features: 'thinking,tools',
                        max_output: 64000
                    },
                    {
                        model_id: 'doubao-seedance-2-0-260128',
                        model_name: 'Doubao Seedance 2.0',
                        types: 'video'
                    },
                    {
                        model_id: 'cartesia-sonic-2',
                        model_name: 'Cartesia Sonic 2',
                        types: 'audio'
                    }
                ]
            }
        } as any);

        const result = await discoverProviderModelsDetailed({
            name: 'AIHubMix',
            apiKey: 'aihubmix-key',
            baseUrl: 'https://aihubmix.com/v1',
            model: 'qwen3.6-plus',
            temperature: 0.5
        });

        expect(result).toEqual({
            models: ['qwen3.6-plus'],
            entries: [
                {
                    id: 'qwen3.6-plus',
                    label: 'Qwen3.6 Plus',
                    maxOutputTokens: 64000
                }
            ],
            source: 'remote'
        });
    });

    test('keeps AIHubMix discovery aligned with the hosted llm-only registry endpoint', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                data: [
                    {
                        model_id: 'gpt-5.4',
                        model_name: 'GPT 5.4',
                        types: 'llm'
                    }
                ]
            }
        } as any);

        const result = await discoverProviderModels({
            name: 'AIHubMix',
            apiKey: 'aihubmix-key',
            baseUrl: 'https://aihubmix.com/v1',
            model: 'gpt-5.4',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://aihubmix.com/api/v1/models?type=llm',
            method: 'GET'
        }));
        expect(result).toEqual({
            models: ['gpt-5.4'],
            source: 'remote'
        });
    });

    test('filters policy-disabled and endpoint-type-only non-generation rows from broader proxy catalogs', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                data: [
                    {
                        id: 'gpt-4.1',
                        endpointType: 'chat'
                    },
                    {
                        id: 'text-embedding-3-large',
                        supportedEndpointTypes: ['embeddings']
                    },
                    {
                        id: 'qwen3-coder-plus',
                        endpoint_type: 'chat'
                    },
                    {
                        id: 'disabled-gpt-4.1',
                        endpointType: 'chat',
                        policy: {
                            state: 'disabled'
                        }
                    }
                ]
            }
        } as any);

        const result = await discoverProviderModels({
            name: 'OpenAI Compatible',
            apiKey: 'sk-test',
            baseUrl: 'https://custom-openai-compatible.example/v1',
            model: 'gpt-4.1',
            temperature: 0.5
        });

        expect(result).toEqual({
            models: ['gpt-4.1', 'qwen3-coder-plus'],
            source: 'remote'
        });
    });

    test('discovers GitHub Models through the hosted catalog plus v1 registry merge', async () => {
        mockedRequestUrl
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: [
                    { id: 'gpt-4o-mini', name: 'GPT-4o mini' },
                    { id: 'text-embedding-3-large', name: 'Text Embedding 3 Large' },
                    { id: 'Phi-4', name: 'Phi-4' }
                ]
            } as any)
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    data: [
                        { id: 'gpt-4o-mini' },
                        { id: 'Phi-4' }
                    ]
                }
            } as any);

        const result = await discoverProviderModels({
            name: 'GitHub Models',
            apiKey: 'github-token',
            baseUrl: 'https://models.github.ai/inference',
            model: 'gpt-4o-mini',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenNthCalledWith(1, expect.objectContaining({
            url: 'https://models.github.ai/catalog/models',
            method: 'GET',
            headers: expect.objectContaining({
                Authorization: 'Bearer github-token',
                'X-Api-Key': 'github-token',
                'X-GitHub-Api-Version': '2022-11-28'
            })
        }));
        expect(mockedRequestUrl).toHaveBeenNthCalledWith(2, expect.objectContaining({
            url: 'https://models.github.ai/v1/models',
            method: 'GET',
            headers: expect.objectContaining({
                Authorization: 'Bearer github-token',
                'X-GitHub-Api-Version': '2022-11-28'
            })
        }));
        expect(result).toEqual({
            models: ['gpt-4o-mini', 'Phi-4'],
            source: 'remote'
        });
    });

    test('discovers PPIO models through the bounded chat, embedding, and reranker registry merge', async () => {
        mockedRequestUrl
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    data: [
                        { id: 'qwen/qwen3-32b' },
                        { id: 'openai/gpt-4o-mini' }
                    ]
                }
            } as any)
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    data: [
                        { id: 'text-embedding-3-large' }
                    ]
                }
            } as any)
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    data: [
                        { id: 'bge-reranker-v2-m3' }
                    ]
                }
            } as any);

        const result = await discoverProviderModels({
            name: 'PPIO',
            apiKey: 'ppio-key',
            baseUrl: 'https://api.ppinfra.com/v3/openai',
            model: 'qwen/qwen3-32b',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenNthCalledWith(1, expect.objectContaining({
            url: 'https://api.ppinfra.com/v3/openai/models',
            method: 'GET',
            headers: expect.objectContaining({
                Authorization: 'Bearer ppio-key',
                'X-Api-Key': 'ppio-key'
            })
        }));
        expect(mockedRequestUrl).toHaveBeenNthCalledWith(2, expect.objectContaining({
            url: 'https://api.ppinfra.com/v3/openai/models?model_type=embedding'
        }));
        expect(mockedRequestUrl).toHaveBeenNthCalledWith(3, expect.objectContaining({
            url: 'https://api.ppinfra.com/v3/openai/models?model_type=reranker'
        }));
        expect(result).toEqual({
            models: ['openai/gpt-4o-mini', 'qwen/qwen3-32b'],
            source: 'remote'
        });
    });

    test('routes generic OpenAI-compatible GitHub Models endpoints through the hosted catalog merge', async () => {
        mockedRequestUrl
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: [
                    { id: 'gpt-4o-mini' },
                    { id: 'text-embedding-3-large' }
                ]
            } as any)
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    data: [
                        { id: 'gpt-4o-mini' }
                    ]
                }
            } as any);

        const result = await discoverProviderModels({
            name: 'OpenAI Compatible',
            apiKey: 'github-token',
            baseUrl: 'https://models.github.ai/inference',
            model: 'gpt-4o-mini',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenNthCalledWith(1, expect.objectContaining({
            url: 'https://models.github.ai/catalog/models',
            headers: expect.objectContaining({
                Authorization: 'Bearer github-token',
                'X-GitHub-Api-Version': '2022-11-28'
            })
        }));
        expect(result).toEqual({
            models: ['gpt-4o-mini'],
            source: 'remote'
        });
    });

    test('normalizes GitHub Models /v1/models endpoints back to the hosted registry root before fetching catalogs', async () => {
        mockedRequestUrl
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: [
                    { id: 'gpt-4o-mini' }
                ]
            } as any)
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    data: [
                        { id: 'gpt-4o-mini' }
                    ]
                }
            } as any);

        const result = await discoverProviderModels({
            name: 'GitHub Models',
            apiKey: 'github-token',
            baseUrl: 'https://models.github.ai/v1/models',
            model: 'gpt-4o-mini',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenNthCalledWith(1, expect.objectContaining({
            url: 'https://models.github.ai/catalog/models'
        }));
        expect(mockedRequestUrl).toHaveBeenNthCalledWith(2, expect.objectContaining({
            url: 'https://models.github.ai/v1/models'
        }));
        expect(result).toEqual({
            models: ['gpt-4o-mini'],
            source: 'remote'
        });
    });

    test('routes generic OpenAI-compatible PPIO endpoints through the dedicated bounded registry merge', async () => {
        mockedRequestUrl
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    data: [
                        { id: 'qwen/qwen3-32b' }
                    ]
                }
            } as any)
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    data: [
                        { id: 'text-embedding-3-large' }
                    ]
                }
            } as any)
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    data: [
                        { id: 'bge-reranker-v2-m3' }
                    ]
                }
            } as any);

        const result = await discoverProviderModels({
            name: 'OpenAI Compatible',
            apiKey: 'ppio-key',
            baseUrl: 'https://api.ppinfra.com/v3/openai',
            model: 'qwen/qwen3-32b',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenNthCalledWith(1, expect.objectContaining({
            url: 'https://api.ppinfra.com/v3/openai/models'
        }));
        expect(mockedRequestUrl).toHaveBeenNthCalledWith(2, expect.objectContaining({
            url: 'https://api.ppinfra.com/v3/openai/models?model_type=embedding'
        }));
        expect(mockedRequestUrl).toHaveBeenNthCalledWith(3, expect.objectContaining({
            url: 'https://api.ppinfra.com/v3/openai/models?model_type=reranker'
        }));
        expect(result).toEqual({
            models: ['qwen/qwen3-32b'],
            source: 'remote'
        });
    });

    test('discovers New API providers through the shared OpenAI-compatible /models parser', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                data: [
                    { id: 'gpt-4.1', supported_endpoint_types: ['chat'] },
                    { id: 'text-embedding-3-large', supported_endpoint_types: ['embeddings'] }
                ]
            }
        } as any);

        const result = await discoverProviderModels({
            name: 'New API',
            apiKey: 'new-api-key',
            baseUrl: 'http://localhost:3000/v1',
            model: 'gpt-4.1',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'http://localhost:3000/v1/models',
            method: 'GET',
            headers: expect.objectContaining({
                Authorization: 'Bearer new-api-key',
                'X-Api-Key': 'new-api-key'
            })
        }));
        expect(result).toEqual({
            models: ['gpt-4.1'],
            source: 'remote'
        });
    });

    test('discovers OVMS models from the current OpenAI-compatible /models endpoint', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                data: [
                    { id: 'llama3.1-8b-instruct' },
                    { id: 'qwen2.5-7b-instruct' }
                ]
            }
        } as any);

        const result = await discoverProviderModels({
            name: 'OVMS',
            apiKey: '',
            baseUrl: 'http://localhost:8000/v3',
            model: 'llama3.1-8b-instruct',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'http://localhost:8000/v3/models',
            method: 'GET'
        }));
        expect(result).toEqual({
            models: ['llama3.1-8b-instruct', 'qwen2.5-7b-instruct'],
            source: 'remote'
        });
    });

    test('keeps OVMS discovery usable by falling back to legacy /v1/config when the modern /v3/models endpoint fails', async () => {
        mockedRequestUrl
            .mockResolvedValueOnce({
                status: 404,
                text: 'not found',
                json: {}
            } as any)
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    'llama3.1-8b-instruct': {
                        model_version_status: [{ state: 'AVAILABLE' }]
                    },
                    'broken-model': {
                        model_version_status: [{ state: 'START' }]
                    },
                    'qwen2.5-7b-instruct': {
                        model_version_status: [{ state: 'AVAILABLE' }]
                    }
                }
            } as any);

        const result = await discoverProviderModels({
            name: 'OVMS',
            apiKey: '',
            baseUrl: 'http://localhost:8000/v3',
            model: 'llama3.1-8b-instruct',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenNthCalledWith(1, expect.objectContaining({
            url: 'http://localhost:8000/v3/models'
        }));
        expect(mockedRequestUrl).toHaveBeenNthCalledWith(2, expect.objectContaining({
            url: 'http://localhost:8000/v1/config'
        }));
        expect(result).toEqual({
            models: ['llama3.1-8b-instruct', 'qwen2.5-7b-instruct'],
            source: 'remote'
        });
    });

    test('routes generic OpenAI-compatible Vercel AI Gateway endpoints through the bounded dual-source merge', async () => {
        mockedRequestUrl
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    object: 'list',
                    data: [
                        { id: 'openai/gpt-5.4', type: 'language' },
                        { id: 'openai/text-embedding-3-large', type: 'embedding' }
                    ]
                }
            } as any)
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    models: [
                        { id: 'anthropic/claude-sonnet-4.5', modelType: 'language' },
                        { id: 'replicate/flux-dev', modelType: 'image' }
                    ]
                }
            } as any);

        const result = await discoverProviderModels({
            name: 'OpenAI Compatible',
            apiKey: 'vercel-key',
            baseUrl: 'https://ai-gateway.vercel.sh/v1',
            model: 'openai/gpt-5.4',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenNthCalledWith(1, expect.objectContaining({
            url: 'https://ai-gateway.vercel.sh/v1/models',
            headers: expect.objectContaining({
                Authorization: 'Bearer vercel-key'
            })
        }));
        expect(mockedRequestUrl).toHaveBeenNthCalledWith(2, expect.objectContaining({
            url: 'https://ai-gateway.vercel.sh/v3/ai/config',
            headers: expect.objectContaining({
                Authorization: 'Bearer vercel-key',
                'ai-gateway-protocol-version': '0.0.1'
            })
        }));
        expect(result).toEqual({
            models: ['anthropic/claude-sonnet-4.5', 'openai/gpt-5.4'],
            source: 'remote'
        });
    });

    test('routes generic OpenAI-compatible Huawei Cloud MaaS endpoints through the dedicated v2 registry', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                data: [
                    { id: 'DeepSeek-V3' },
                    { model_name: 'Qwen3-235B-A22B' }
                ]
            }
        } as any);

        const result = await discoverProviderModels({
            name: 'OpenAI Compatible',
            apiKey: 'huaweicloud-key',
            baseUrl: 'https://api.modelarts-maas.com/openai/v1',
            model: 'DeepSeek-V3',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://api.modelarts-maas.com/v2/models',
            headers: expect.objectContaining({
                Authorization: 'Bearer huaweicloud-key'
            })
        }));
        expect(result).toEqual({
            models: ['DeepSeek-V3', 'Qwen3-235B-A22B'],
            source: 'remote'
        });
    });

    test('routes generic OpenAI-compatible local proxy endpoints through the bounded LiteLLM-style merge', async () => {
        mockedRequestUrl
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    data: [
                        { id: 'openai/gpt-4.1-mini' }
                    ]
                }
            } as any)
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    data: [
                        { model_name: 'google/gemini-2.5-pro' }
                    ]
                }
            } as any);

        const result = await discoverProviderModels({
            name: 'OpenAI Compatible',
            apiKey: '',
            baseUrl: 'http://localhost:4000/v1',
            model: 'openai/gpt-4.1-mini',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenNthCalledWith(1, expect.objectContaining({
            url: 'http://localhost:4000/v1/models'
        }));
        expect(mockedRequestUrl).toHaveBeenNthCalledWith(2, expect.objectContaining({
            url: 'http://localhost:4000/v1/model/info'
        }));
        expect(result).toEqual({
            models: ['google/gemini-2.5-pro', 'openai/gpt-4.1-mini'],
            source: 'remote'
        });
    });

    test('routes generic OpenAI-compatible OVMS-style local v3 endpoints through the bounded OVMS discovery path', async () => {
        mockedRequestUrl
            .mockResolvedValueOnce({
                status: 404,
                text: 'not found',
                json: {}
            } as any)
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    'llama3.1-8b-instruct': {
                        model_version_status: [{ state: 'AVAILABLE' }]
                    },
                    'qwen2.5-7b-instruct': {
                        model_version_status: [{ state: 'AVAILABLE' }]
                    }
                }
            } as any);

        const result = await discoverProviderModels({
            name: 'OpenAI Compatible',
            apiKey: '',
            baseUrl: 'http://localhost:8000/v3',
            model: 'llama3.1-8b-instruct',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenNthCalledWith(1, expect.objectContaining({
            url: 'http://localhost:8000/v3/models'
        }));
        expect(mockedRequestUrl).toHaveBeenNthCalledWith(2, expect.objectContaining({
            url: 'http://localhost:8000/v1/config'
        }));
        expect(result).toEqual({
            models: ['llama3.1-8b-instruct', 'qwen2.5-7b-instruct'],
            source: 'remote'
        });
    });

    test('accepts broader OpenAI-compatible list payloads that expose nested result arrays', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                result: {
                    data: [
                        { id: 'gpt-4.1' },
                        { name: 'gpt-4o' },
                        { model_name: 'gpt-4.1-mini' }
                    ]
                }
            }
        } as any);

        const result = await discoverProviderModels({
            name: 'OpenAI Compatible',
            apiKey: 'sk-test',
            baseUrl: 'https://custom-openai-compatible.example/v1',
            model: 'gpt-4.1',
            temperature: 0.5
        });

        expect(result).toEqual({
            models: ['gpt-4.1', 'gpt-4.1-mini', 'gpt-4o'],
            source: 'remote'
        });
    });

    test('ignores metadata strings inside wrapper objects while still extracting nested model entries', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                response: {
                    message: 'ok',
                    success: true,
                    data: {
                        entries: [
                            { id: 'gpt-4.1' },
                            { id: 'text-embedding-3-large', supported_endpoint_types: ['embedding'] },
                            { display_name: 'GPT-4o', name: 'gpt-4o' }
                        ]
                    }
                }
            }
        } as any);

        const result = await discoverProviderModels({
            name: 'OpenAI Compatible',
            apiKey: 'sk-test',
            baseUrl: 'https://custom-openai-compatible.example/v1',
            model: 'gpt-4.1',
            temperature: 0.5
        });

        expect(result).toEqual({
            models: ['gpt-4.1', 'gpt-4o'],
            source: 'remote'
        });
    });

    test('filters obvious non-generation OpenAI-compatible models from discovery results', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                data: [
                    { id: 'gpt-4.1' },
                    { id: 'text-embedding-3-large' },
                    { id: 'whisper-1' },
                    { id: 'tts-1' },
                    { id: 'black-forest-labs/FLUX.1-dev' },
                    { id: 'qwen-vl-max' }
                ]
            }
        } as any);

        const result = await discoverProviderModels({
            name: 'OpenAI Compatible',
            apiKey: 'sk-test',
            baseUrl: 'https://custom-openai-compatible.example/v1',
            model: 'gpt-4.1',
            temperature: 0.5
        });

        expect(result).toEqual({
            models: ['gpt-4.1', 'qwen-vl-max'],
            source: 'remote'
        });
    });

    test('accepts broader OpenAI-compatible model-list schemas beyond data[].id', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                models: [
                    { name: 'gpt-4.1' },
                    { model: 'gpt-4o' },
                    { model_id: 'gpt-4.1-mini' },
                    { model_name: 'gpt-4o-mini' }
                ]
            }
        } as any);

        const result = await discoverProviderModels({
            name: 'OpenAI Compatible',
            apiKey: 'sk-test',
            baseUrl: 'https://custom-openai-compatible.example/v1',
            model: 'gpt-4.1',
            temperature: 0.5
        });

        expect(result).toEqual({
            models: ['gpt-4.1', 'gpt-4.1-mini', 'gpt-4o', 'gpt-4o-mini'],
            source: 'remote'
        });
    });

    test('normalizes OpenAI-compatible chat/completions endpoints before fetching models', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: { data: [{ id: 'gpt-4.1' }] }
        } as any);

        await discoverProviderModels({
            name: 'OpenAI',
            apiKey: 'sk-test',
            baseUrl: 'https://api.openai.com/v1/chat/completions',
            model: 'gpt-4.1',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://api.openai.com/v1/models'
        }));
    });

    test('normalizes OpenAI-compatible responses endpoints before fetching models', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: { data: [{ id: 'gpt-4.1' }] }
        } as any);

        await discoverProviderModels({
            name: 'OpenAI Compatible',
            apiKey: 'sk-test',
            baseUrl: 'https://api.openai.com/v1/responses',
            model: 'gpt-4.1',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://api.openai.com/v1/models'
        }));
    });

    test('normalizes OpenAI-compatible model endpoints with query/hash before fetching models', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: { data: [{ id: 'gpt-4.1' }] }
        } as any);

        await discoverProviderModels({
            name: 'OpenAI Compatible',
            apiKey: 'sk-test',
            baseUrl: 'https://api.openai.com/v1/models?view=full#catalog',
            model: 'gpt-4.1',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://api.openai.com/v1/models'
        }));
    });

    test('discovers models from LM Studio through the shared OpenAI-compatible models endpoint', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                data: [
                    { id: 'qwen3-coder-local' },
                    { id: 'deepseek-r1-local' }
                ]
            }
        } as any);

        const result = await discoverProviderModels({
            name: 'LMStudio',
            apiKey: 'EMPTY',
            baseUrl: 'http://localhost:1234/v1',
            model: 'qwen3-coder-local',
            temperature: 0.7
        });

        expect(mockedRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'http://localhost:1234/v1/models',
            method: 'GET',
            headers: expect.objectContaining({
                Authorization: 'Bearer EMPTY',
                'X-Api-Key': 'EMPTY'
            })
        }));
        expect(result).toEqual({
            models: ['deepseek-r1-local', 'qwen3-coder-local'],
            source: 'remote'
        });
    });

    test('discovers models from Hugging Face through the shared OpenAI-compatible models endpoint', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                data: [
                    { id: 'openai/gpt-oss-120b' },
                    { id: 'meta-llama/Llama-4-Scout-17B-16E-Instruct' }
                ]
            }
        } as any);

        const result = await discoverProviderModels({
            name: 'Hugging Face',
            apiKey: 'hf-test',
            baseUrl: 'https://router.huggingface.co/v1',
            model: 'openai/gpt-oss-120b',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://router.huggingface.co/v1/models',
            method: 'GET',
            headers: expect.objectContaining({
                Authorization: 'Bearer hf-test',
                'X-Api-Key': 'hf-test'
            })
        }));
        expect(result).toEqual({
            models: ['meta-llama/Llama-4-Scout-17B-16E-Instruct', 'openai/gpt-oss-120b'],
            source: 'remote'
        });
    });

    test('keeps OpenAI-compatible discovery headers aligned for Cerebras-specific integration requirements', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                data: [
                    { id: 'gpt-oss-120b' }
                ]
            }
        } as any);

        const result = await discoverProviderModels({
            name: 'Cerebras',
            apiKey: 'cerebras-key',
            baseUrl: 'https://api.cerebras.ai/v1',
            model: 'gpt-oss-120b',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://api.cerebras.ai/v1/models',
            method: 'GET',
            headers: expect.objectContaining({
                Authorization: 'Bearer cerebras-key',
                'X-Api-Key': 'cerebras-key',
                'X-Cerebras-3rd-Party-Integration': 'notemd'
            })
        }));
        expect(result).toEqual({
            models: ['gpt-oss-120b'],
            source: 'remote'
        });
    });

    test('discovers xAI language models through the dedicated language-models registry', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                data: [
                    {
                        id: 'grok-4',
                        aliases: ['grok-4-latest'],
                        max_output_tokens: 8192
                    },
                    {
                        id: 'grok-4-fast-reasoning',
                        max_output_tokens: 30000
                    },
                    {
                        id: 'grok-vision-preview',
                        output_modalities: 'image'
                    }
                ]
            }
        } as any);

        const result = await discoverProviderModelsDetailed({
            name: 'xAI',
            apiKey: 'xai-key',
            baseUrl: 'https://api.x.ai/v1',
            model: 'grok-4',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://api.x.ai/v1/language-models',
            method: 'GET',
            headers: expect.objectContaining({
                Authorization: 'Bearer xai-key',
                'X-Api-Key': 'xai-key'
            })
        }));
        expect(result).toEqual({
            models: ['grok-4', 'grok-4-fast-reasoning'],
            entries: [
                {
                    id: 'grok-4',
                    maxOutputTokens: 8192
                },
                {
                    id: 'grok-4-fast-reasoning',
                    maxOutputTokens: 30000
                }
            ],
            source: 'remote'
        });
    });

    test('falls back to generic /models when xAI language-models registry is unavailable', async () => {
        mockedRequestUrl
            .mockRejectedValueOnce(new Error('language-models unavailable'))
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    data: [
                        { id: 'grok-4' },
                        { id: 'grok-4-fast-reasoning' }
                    ]
                }
            } as any);

        const result = await discoverProviderModels({
            name: 'xAI',
            apiKey: 'xai-key',
            baseUrl: 'https://api.x.ai/v1',
            model: 'grok-4',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenNthCalledWith(1, expect.objectContaining({
            url: 'https://api.x.ai/v1/language-models'
        }));
        expect(mockedRequestUrl).toHaveBeenNthCalledWith(2, expect.objectContaining({
            url: 'https://api.x.ai/v1/models'
        }));
        expect(result).toEqual({
            models: ['grok-4', 'grok-4-fast-reasoning'],
            source: 'remote'
        });
    });

    test('uses alias only as a fallback identifier instead of expanding every alias into the picker', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                data: [
                    {
                        aliases: ['grok-4-latest', 'grok-4-stable'],
                        max_output_tokens: 8192
                    }
                ]
            }
        } as any);

        const result = await discoverProviderModelsDetailed({
            name: 'OpenAI Compatible',
            apiKey: 'sk-test',
            baseUrl: 'https://custom-openai-compatible.example/v1',
            model: 'grok-4-latest',
            temperature: 0.5
        });

        expect(result).toEqual({
            models: ['grok-4-latest'],
            entries: [
                {
                    id: 'grok-4-latest',
                    maxOutputTokens: 8192
                }
            ],
            source: 'remote'
        });
    });

    test('discovers LiteLLM models by merging /models and /model/info surfaces', async () => {
        mockedRequestUrl
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    data: [
                        { id: 'openai/gpt-4.1-mini' },
                        { id: 'anthropic/claude-3-7-sonnet-20250219' }
                    ]
                }
            } as any)
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    data: [
                        { model_name: 'openai/gpt-4.1-mini' },
                        { model_name: 'google/gemini-2.5-pro' }
                    ]
                }
            } as any);

        const result = await discoverProviderModels({
            name: 'LiteLLM',
            apiKey: 'proxy-key',
            baseUrl: 'http://localhost:4000/v1',
            model: 'openai/gpt-4.1-mini',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenNthCalledWith(1, expect.objectContaining({
            url: 'http://localhost:4000/v1/models'
        }));
        expect(mockedRequestUrl).toHaveBeenNthCalledWith(2, expect.objectContaining({
            url: 'http://localhost:4000/v1/model/info'
        }));
        expect(result).toEqual({
            models: ['anthropic/claude-3-7-sonnet-20250219', 'google/gemini-2.5-pro', 'openai/gpt-4.1-mini'],
            source: 'remote'
        });
    });

    test('prefers LiteLLM public model ids from litellm_params and preserves nested model_info token hints', async () => {
        mockedRequestUrl
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    data: [
                        { id: 'openai/gpt-4.1-mini' }
                    ]
                }
            } as any)
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    data: [
                        {
                            model_name: 'GPT-4.1 Mini',
                            litellm_params: {
                                model: 'openai/gpt-4.1-mini'
                            },
                            model_info: {
                                max_tokens: 32768
                            }
                        },
                        {
                            model_name: 'Claude Sonnet 4.5',
                            litellm_params: {
                                model: 'anthropic/claude-sonnet-4-5'
                            },
                            model_info: {
                                max_output_tokens: '65536'
                            }
                        },
                        {
                            model_name: 'Text Embedding 3 Large',
                            litellm_params: {
                                model: 'openai/text-embedding-3-large'
                            },
                            model_info: {
                                max_output_tokens: 8192
                            }
                        }
                    ]
                }
            } as any);

        const result = await discoverProviderModelsDetailed({
            name: 'LiteLLM',
            apiKey: 'proxy-key',
            baseUrl: 'http://localhost:4000/v1',
            model: 'openai/gpt-4.1-mini',
            temperature: 0.5
        });

        expect(result).toEqual({
            models: ['anthropic/claude-sonnet-4-5', 'openai/gpt-4.1-mini'],
            entries: [
                {
                    id: 'anthropic/claude-sonnet-4-5',
                    label: 'Claude Sonnet 4.5',
                    maxOutputTokens: 65536
                },
                {
                    id: 'openai/gpt-4.1-mini',
                    label: 'GPT-4.1 Mini',
                    maxOutputTokens: 32768
                }
            ],
            source: 'remote'
        });
    });

    test('discovers OpenRouter models by merging chat and embedding catalogs', async () => {
        mockedRequestUrl
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    data: [
                        { id: 'anthropic/claude-sonnet-4.5' },
                        { id: 'openai/gpt-4.1' }
                    ]
                }
            } as any)
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    data: [
                        { id: 'openai/text-embedding-3-large' },
                        { id: 'cohere/command-rerank' }
                    ]
                }
            } as any);

        const result = await discoverProviderModels({
            name: 'OpenRouter',
            apiKey: 'router-key',
            baseUrl: 'https://openrouter.ai/api/v1',
            model: 'anthropic/claude-sonnet-4.5',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenNthCalledWith(1, expect.objectContaining({
            url: 'https://openrouter.ai/api/v1/models',
            headers: expect.objectContaining({
                Authorization: 'Bearer router-key',
                'HTTP-Referer': 'https://github.com/Jacobinwwey/obsidian-NotEMD',
                'X-Title': 'Notemd Obsidian Plugin'
            })
        }));
        expect(mockedRequestUrl).toHaveBeenNthCalledWith(2, expect.objectContaining({
            url: 'https://openrouter.ai/api/v1/embeddings/models'
        }));
        expect(result).toEqual({
            models: ['anthropic/claude-sonnet-4.5', 'openai/gpt-4.1'],
            source: 'remote'
        });
    });

    test('normalizes OpenRouter embedding registry endpoints back to the provider root before merging catalogs', async () => {
        mockedRequestUrl
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    data: [
                        { id: 'anthropic/claude-sonnet-4.5' }
                    ]
                }
            } as any)
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    data: [
                        { id: 'openai/text-embedding-3-large' }
                    ]
                }
            } as any);

        const result = await discoverProviderModels({
            name: 'OpenRouter',
            apiKey: 'router-key',
            baseUrl: 'https://openrouter.ai/api/v1/embeddings/models',
            model: 'anthropic/claude-sonnet-4.5',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenNthCalledWith(1, expect.objectContaining({
            url: 'https://openrouter.ai/api/v1/models'
        }));
        expect(mockedRequestUrl).toHaveBeenNthCalledWith(2, expect.objectContaining({
            url: 'https://openrouter.ai/api/v1/embeddings/models'
        }));
        expect(result).toEqual({
            models: ['anthropic/claude-sonnet-4.5'],
            source: 'remote'
        });
    });

    test('normalizes OpenRouter chat registry endpoints back to the provider root before merging catalogs', async () => {
        mockedRequestUrl
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    data: [
                        { id: 'anthropic/claude-sonnet-4.5' }
                    ]
                }
            } as any)
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    data: [
                        { id: 'openai/text-embedding-3-large' }
                    ]
                }
            } as any);

        const result = await discoverProviderModels({
            name: 'OpenRouter',
            apiKey: 'router-key',
            baseUrl: 'https://openrouter.ai/api/v1/models',
            model: 'anthropic/claude-sonnet-4.5',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenNthCalledWith(1, expect.objectContaining({
            url: 'https://openrouter.ai/api/v1/models'
        }));
        expect(mockedRequestUrl).toHaveBeenNthCalledWith(2, expect.objectContaining({
            url: 'https://openrouter.ai/api/v1/embeddings/models'
        }));
        expect(result).toEqual({
            models: ['anthropic/claude-sonnet-4.5'],
            source: 'remote'
        });
    });

    test('accepts object-shaped discovery payloads that expose provider keyed model catalogs', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                catalog: {
                    'gpt-4.1': { modelName: 'gpt-4.1' },
                    'qwen3-coder-plus': {
                        model_name: 'qwen3-coder-plus',
                        supported_endpoint_types: ['chat']
                    },
                    'text-embedding-3-large': {
                        model_name: 'text-embedding-3-large',
                        supported_endpoint_types: ['embedding']
                    }
                }
            }
        } as any);

        const result = await discoverProviderModels({
            name: 'OpenAI Compatible',
            apiKey: 'sk-test',
            baseUrl: 'https://custom-openai-compatible.example/v1',
            model: 'gpt-4.1',
            temperature: 0.5
        });

        expect(result).toEqual({
            models: ['gpt-4.1', 'qwen3-coder-plus'],
            source: 'remote'
        });
    });

    test('accepts grouped object-shaped discovery payloads whose providers map to model arrays', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                catalog: {
                    openai: [
                        { id: 'gpt-4.1' },
                        { id: 'text-embedding-3-large', supported_endpoint_types: ['embedding'] }
                    ],
                    anthropic: [
                        { id: 'claude-sonnet-4-20250514', type: 'language' }
                    ],
                    internal: [
                        { model_name: 'qwen3-coder-plus', supported_endpoint_types: ['chat'] }
                    ]
                }
            }
        } as any);

        const result = await discoverProviderModels({
            name: 'OpenAI Compatible',
            apiKey: 'sk-test',
            baseUrl: 'https://custom-openai-compatible.example/v1',
            model: 'gpt-4.1',
            temperature: 0.5
        });

        expect(result).toEqual({
            models: ['claude-sonnet-4-20250514', 'gpt-4.1', 'qwen3-coder-plus'],
            source: 'remote'
        });
    });

    test('accepts provider-model registries exposed under provider_models maps and preserves richer metadata', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                provider_models: {
                    openai: {
                        models: [
                            {
                                id: 'gpt-4.1',
                                supported_output_modalities: ['text'],
                                limits: { max_output_tokens: 32768 }
                            },
                            {
                                id: 'text-embedding-3-large',
                                supported_output_modalities: ['embedding']
                            }
                        ]
                    },
                    anthropic: {
                        list: [
                            {
                                specification: {
                                    modelId: 'anthropic/claude-sonnet-4.5',
                                    supportedGenerationMethods: ['messages'],
                                    supportedOutputModalities: ['text']
                                },
                                model_info: {
                                    maxOutputTokens: 64000
                                }
                            }
                        ]
                    }
                }
            }
        } as any);

        const result = await discoverProviderModelsDetailed({
            name: 'OpenAI Compatible',
            apiKey: 'sk-test',
            baseUrl: 'https://custom-openai-compatible.example/v1',
            model: 'gpt-4.1',
            temperature: 0.5
        });

        expect(result).toEqual({
            models: ['anthropic/claude-sonnet-4.5', 'gpt-4.1'],
            entries: [
                {
                    id: 'anthropic/claude-sonnet-4.5',
                    maxOutputTokens: 64000
                },
                {
                    id: 'gpt-4.1',
                    maxOutputTokens: 32768
                }
            ],
            source: 'remote'
        });
    });

    test('accepts publisher-model registries and normalizes publisher resource names down to usable model ids', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                publisherModels: [
                    {
                        name: 'publishers/openai/models/gpt-5-mini',
                        displayName: 'GPT 5 Mini',
                        supportedGenerationMethods: ['generateContent'],
                        outputTokenLimit: 8192
                    },
                    {
                        name: 'publishers/google/models/text-embedding-005',
                        displayName: 'Text Embedding 005',
                        supportedGenerationMethods: ['embedContent'],
                        outputTokenLimit: 2048
                    },
                    {
                        name: 'models/gemini-2.5-pro',
                        displayName: 'Gemini 2.5 Pro',
                        supportedGenerationMethods: ['streamGenerateContent'],
                        outputTokenLimit: 65536
                    }
                ]
            }
        } as any);

        const result = await discoverProviderModelsDetailed({
            name: 'OpenAI Compatible',
            apiKey: 'sk-test',
            baseUrl: 'https://custom-openai-compatible.example/v1',
            model: 'gpt-5-mini',
            temperature: 0.5
        });

        expect(result).toEqual({
            models: ['gemini-2.5-pro', 'gpt-5-mini'],
            entries: [
                {
                    id: 'gemini-2.5-pro',
                    label: 'Gemini 2.5 Pro',
                    maxOutputTokens: 65536
                },
                {
                    id: 'gpt-5-mini',
                    label: 'GPT 5 Mini',
                    maxOutputTokens: 8192
                }
            ],
            source: 'remote'
        });
    });

    test('accepts wrapped provider and publisher registries under common data/result containers', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                result: {
                    data: {
                        provider_models: {
                            openai: {
                                models: [
                                    {
                                        id: 'gpt-4.1',
                                        supported_output_modalities: ['text'],
                                        limits: { max_output_tokens: 32768 }
                                    }
                                ]
                            }
                        },
                        publisherModels: [
                            {
                                name: 'publishers/openai/models/gpt-5-mini',
                                displayName: 'GPT 5 Mini',
                                supportedGenerationMethods: ['generateContent'],
                                outputTokenLimit: 8192
                            },
                            {
                                name: 'publishers/google/models/text-embedding-005',
                                displayName: 'Text Embedding 005',
                                supportedGenerationMethods: ['embedContent'],
                                outputTokenLimit: 2048
                            }
                        ]
                    }
                }
            }
        } as any);

        const result = await discoverProviderModelsDetailed({
            name: 'OpenAI Compatible',
            apiKey: 'sk-test',
            baseUrl: 'https://custom-openai-compatible.example/v1',
            model: 'gpt-4.1',
            temperature: 0.5
        });

        expect(result).toEqual({
            models: ['gpt-4.1', 'gpt-5-mini'],
            entries: [
                {
                    id: 'gpt-4.1',
                    maxOutputTokens: 32768
                },
                {
                    id: 'gpt-5-mini',
                    label: 'GPT 5 Mini',
                    maxOutputTokens: 8192
                }
            ],
            source: 'remote'
        });
    });

    test('accepts wrapped registry and services catalogs under common response containers', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                response: {
                    data: {
                        registry: {
                            openai: {
                                models: [
                                    {
                                        id: 'gpt-4.1',
                                        supported_output_modalities: ['text'],
                                        limits: { max_output_tokens: 32768 }
                                    }
                                ]
                            }
                        },
                        services: {
                            internal: {
                                list: [
                                    {
                                        specification: {
                                            modelId: 'anthropic/claude-sonnet-4.5',
                                            supportedGenerationMethods: ['messages'],
                                            supportedOutputModalities: ['text']
                                        },
                                        model_info: {
                                            maxOutputTokens: 64000
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        } as any);

        const result = await discoverProviderModelsDetailed({
            name: 'OpenAI Compatible',
            apiKey: 'sk-test',
            baseUrl: 'https://custom-openai-compatible.example/v1',
            model: 'gpt-4.1',
            temperature: 0.5
        });

        expect(result).toEqual({
            models: ['anthropic/claude-sonnet-4.5', 'gpt-4.1'],
            entries: [
                {
                    id: 'anthropic/claude-sonnet-4.5',
                    maxOutputTokens: 64000
                },
                {
                    id: 'gpt-4.1',
                    maxOutputTokens: 32768
                }
            ],
            source: 'remote'
        });
    });

    test('accepts nested provider catalogs whose provider objects expose models arrays', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                catalog: {
                    openai: {
                        models: [
                            { id: 'gpt-4.1' },
                            { id: 'text-embedding-3-large', supported_endpoint_types: ['embedding'] }
                        ]
                    },
                    anthropic: {
                        models: [
                            { id: 'claude-sonnet-4-20250514', type: 'language' }
                        ]
                    },
                    internal: {
                        list: [
                            { model_name: 'qwen3-coder-plus', supported_endpoint_types: ['chat'] }
                        ]
                    }
                }
            }
        } as any);

        const result = await discoverProviderModels({
            name: 'OpenAI Compatible',
            apiKey: 'sk-test',
            baseUrl: 'https://custom-openai-compatible.example/v1',
            model: 'gpt-4.1',
            temperature: 0.5
        });

        expect(result).toEqual({
            models: ['claude-sonnet-4-20250514', 'gpt-4.1', 'qwen3-coder-plus'],
            source: 'remote'
        });
    });

    test('accepts nested catalog models arrays exposed under catalog.models', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                catalog: {
                    models: [
                        { id: 'gpt-4.1' },
                        { specification: { modelId: 'anthropic/claude-sonnet-4.5', type: 'language' } },
                        { id: 'text-embedding-3-large', supported_endpoint_types: ['embedding'] }
                    ]
                }
            }
        } as any);

        const result = await discoverProviderModels({
            name: 'OpenAI Compatible',
            apiKey: 'sk-test',
            baseUrl: 'https://custom-openai-compatible.example/v1',
            model: 'gpt-4.1',
            temperature: 0.5
        });

        expect(result).toEqual({
            models: ['anthropic/claude-sonnet-4.5', 'gpt-4.1'],
            source: 'remote'
        });
    });

    test('keeps LiteLLM discovery resilient when one discovery surface fails', async () => {
        mockedRequestUrl
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    data: [{ id: 'openai/gpt-4.1-mini' }]
                }
            } as any)
            .mockRejectedValueOnce(new Error('ECONNREFUSED'));

        const result = await discoverProviderModels({
            name: 'LiteLLM',
            apiKey: 'proxy-key',
            baseUrl: 'http://localhost:4000/v1',
            model: 'openai/gpt-4.1-mini',
            temperature: 0.5
        });

        expect(result).toEqual({
            models: ['openai/gpt-4.1-mini'],
            source: 'remote'
        });
    });

    test('discovers models from Together providers via the dedicated array-style /models response', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: [
                { id: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo' },
                { id: 'deepseek-ai/DeepSeek-V3.2-Turbo' },
                { id: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo' }
            ]
        } as any);

        const result = await discoverProviderModels({
            name: 'Together',
            apiKey: 'together-key',
            baseUrl: 'https://api.together.xyz/v1',
            model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://api.together.xyz/v1/models',
            method: 'GET',
            headers: expect.objectContaining({
                Authorization: 'Bearer together-key'
            })
        }));
        expect(result).toEqual({
            models: ['deepseek-ai/DeepSeek-V3.2-Turbo', 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo'],
            source: 'remote'
        });
    });

    test('discovers Vercel AI Gateway models from the config registry endpoint', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                models: [
                    { id: 'anthropic/claude-sonnet-4.5', modelType: 'language' },
                    { id: 'alibaba/qwen3.6-plus', modelType: 'language' },
                    { id: 'anthropic/claude-sonnet-4.5' }
                ]
            }
        } as any);

        const result = await discoverProviderModels({
            name: 'Vercel AI Gateway',
            apiKey: 'vercel-key',
            baseUrl: 'https://ai-gateway.vercel.sh/v1',
            model: 'anthropic/claude-sonnet-4.5',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://ai-gateway.vercel.sh/v3/ai/config',
            method: 'GET',
            headers: expect.objectContaining({
                Authorization: 'Bearer vercel-key',
                'ai-gateway-protocol-version': '0.0.1'
            })
        }));
        expect(result).toEqual({
            models: ['alibaba/qwen3.6-plus', 'anthropic/claude-sonnet-4.5'],
            source: 'remote'
        });
    });

    test('accepts gateway registry entries that expose model ids and types through nested specification fields', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                models: [
                    {
                        name: 'Qwen3 Max',
                        specification: {
                            modelId: 'alibaba/qwen3-max',
                            type: 'language'
                        }
                    },
                    {
                        specification: {
                            modelId: 'openai/text-embedding-3-large',
                            type: 'embedding'
                        }
                    },
                    {
                        slug: 'anthropic/claude-sonnet-4.5',
                        modelType: 'language'
                    }
                ]
            }
        } as any);

        const result = await discoverProviderModels({
            name: 'Vercel AI Gateway',
            apiKey: 'vercel-key',
            baseUrl: 'https://ai-gateway.vercel.sh/v1',
            model: 'anthropic/claude-sonnet-4.5',
            temperature: 0.5
        });

        expect(result).toEqual({
            models: ['alibaba/qwen3-max', 'anthropic/claude-sonnet-4.5'],
            source: 'remote'
        });
    });

    test('merges Vercel AI Gateway official /v1/models results with the config registry endpoint', async () => {
        mockedRequestUrl
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    object: 'list',
                    data: [
                        { id: 'openai/gpt-5.4', type: 'language' },
                        { id: 'google/gemini-3-pro', type: 'language' },
                        { id: 'openai/text-embedding-3-large', type: 'embedding' }
                    ]
                }
            } as any)
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    models: [
                        { id: 'anthropic/claude-sonnet-4.5', modelType: 'language' },
                        { id: 'google/gemini-3-pro', modelType: 'language' },
                        { id: 'replicate/flux-dev', modelType: 'image' }
                    ]
                }
            } as any);

        const result = await discoverProviderModels({
            name: 'Vercel AI Gateway',
            apiKey: 'vercel-key',
            baseUrl: 'https://ai-gateway.vercel.sh/v1',
            model: 'anthropic/claude-sonnet-4.5',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenNthCalledWith(1, expect.objectContaining({
            url: 'https://ai-gateway.vercel.sh/v1/models',
            method: 'GET',
            headers: expect.objectContaining({
                Authorization: 'Bearer vercel-key'
            })
        }));
        expect(mockedRequestUrl).toHaveBeenNthCalledWith(2, expect.objectContaining({
            url: 'https://ai-gateway.vercel.sh/v3/ai/config',
            method: 'GET',
            headers: expect.objectContaining({
                Authorization: 'Bearer vercel-key',
                'ai-gateway-protocol-version': '0.0.1'
            })
        }));
        expect(result).toEqual({
            models: ['anthropic/claude-sonnet-4.5', 'google/gemini-3-pro', 'openai/gpt-5.4'],
            source: 'remote'
        });
    });

    test('keeps Vercel AI Gateway discovery usable when the official /v1/models endpoint fails but the config registry still responds', async () => {
        mockedRequestUrl
            .mockRejectedValueOnce(new Error('Vercel /v1/models unavailable'))
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    models: [
                        { id: 'anthropic/claude-sonnet-4.5', modelType: 'language' },
                        { id: 'alibaba/qwen3.6-plus', modelType: 'language' }
                    ]
                }
            } as any);

        const result = await discoverProviderModels({
            name: 'Vercel AI Gateway',
            apiKey: 'vercel-key',
            baseUrl: 'https://ai-gateway.vercel.sh/v1',
            model: 'anthropic/claude-sonnet-4.5',
            temperature: 0.5
        });

        expect(result).toEqual({
            models: ['alibaba/qwen3.6-plus', 'anthropic/claude-sonnet-4.5'],
            source: 'remote'
        });
    });

    test('keeps Vercel AI Gateway discovery usable when the config registry fails but the official /v1/models endpoint still responds', async () => {
        mockedRequestUrl
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    object: 'list',
                    data: [
                        { id: 'openai/gpt-5.4', type: 'language' },
                        { id: 'openai/text-embedding-3-large', type: 'embedding' }
                    ]
                }
            } as any)
            .mockRejectedValueOnce(new Error('Vercel config registry unavailable'));

        const result = await discoverProviderModels({
            name: 'Vercel AI Gateway',
            apiKey: 'vercel-key',
            baseUrl: 'https://ai-gateway.vercel.sh/v1',
            model: 'openai/gpt-5.4',
            temperature: 0.5
        });

        expect(result).toEqual({
            models: ['openai/gpt-5.4'],
            source: 'remote'
        });
    });

    test('filters non-language Vercel AI Gateway models while keeping language and unspecified entries', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                models: [
                    { id: 'anthropic/claude-sonnet-4.5', modelType: 'language' },
                    { id: 'openai/text-embedding-3-large', modelType: 'embedding' },
                    { id: 'openai/gpt-4o' },
                    { id: 'replicate/flux-dev', modelType: 'image' }
                ]
            }
        } as any);

        const result = await discoverProviderModels({
            name: 'Vercel AI Gateway',
            apiKey: 'vercel-key',
            baseUrl: 'https://ai-gateway.vercel.sh/v1',
            model: 'anthropic/claude-sonnet-4.5',
            temperature: 0.5
        });

        expect(result).toEqual({
            models: ['anthropic/claude-sonnet-4.5', 'openai/gpt-4o'],
            source: 'remote'
        });
    });

    test('sends gateway headers for Requesty/OpenRouter-compatible discovery calls', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: { data: [{ id: 'claude-3.7-sonnet' }] }
        } as any);

        await discoverProviderModels({
            name: 'Requesty',
            apiKey: 'rq-test',
            baseUrl: 'https://router.requesty.ai/v1',
            model: 'claude-3.7-sonnet',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
            headers: expect.objectContaining({
                Authorization: 'Bearer rq-test',
                'HTTP-Referer': 'https://github.com/Jacobinwwey/obsidian-NotEMD',
                'X-Title': 'Notemd Obsidian Plugin'
            })
        }));
    });

    test('normalizes Vercel AI Gateway chat endpoints before fetching model config', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: { models: [{ id: 'anthropic/claude-sonnet-4.5' }] }
        } as any);

        await discoverProviderModels({
            name: 'Vercel AI Gateway',
            apiKey: 'vercel-key',
            baseUrl: 'https://ai-gateway.vercel.sh/v1/chat/completions',
            model: 'anthropic/claude-sonnet-4.5',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://ai-gateway.vercel.sh/v3/ai/config'
        }));
    });

    test('normalizes Vercel AI Gateway config endpoints back to the gateway root before discovery requests', async () => {
        mockedRequestUrl
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    object: 'list',
                    data: [
                        { id: 'openai/gpt-5.4', type: 'language' }
                    ]
                }
            } as any)
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    models: [
                        { id: 'anthropic/claude-sonnet-4.5', modelType: 'language' }
                    ]
                }
            } as any);

        const result = await discoverProviderModels({
            name: 'Vercel AI Gateway',
            apiKey: 'vercel-key',
            baseUrl: 'https://ai-gateway.vercel.sh/v3/ai/config',
            model: 'anthropic/claude-sonnet-4.5',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenNthCalledWith(1, expect.objectContaining({
            url: 'https://ai-gateway.vercel.sh/v1/models'
        }));
        expect(mockedRequestUrl).toHaveBeenNthCalledWith(2, expect.objectContaining({
            url: 'https://ai-gateway.vercel.sh/v3/ai/config'
        }));
        expect(result).toEqual({
            models: ['anthropic/claude-sonnet-4.5', 'openai/gpt-5.4'],
            source: 'remote'
        });
    });

    test('normalizes Vercel AI Gateway /v1/ai/models endpoints before discovery requests', async () => {
        mockedRequestUrl
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    object: 'list',
                    data: [
                        { id: 'openai/gpt-5.4', type: 'language' }
                    ]
                }
            } as any)
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    models: [
                        { id: 'anthropic/claude-sonnet-4.5', modelType: 'language' }
                    ]
                }
            } as any);

        const result = await discoverProviderModels({
            name: 'OpenAI Compatible',
            apiKey: 'vercel-key',
            baseUrl: 'https://ai-gateway.vercel.sh/v1/ai/models',
            model: 'anthropic/claude-sonnet-4.5',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenNthCalledWith(1, expect.objectContaining({
            url: 'https://ai-gateway.vercel.sh/v1/models'
        }));
        expect(mockedRequestUrl).toHaveBeenNthCalledWith(2, expect.objectContaining({
            url: 'https://ai-gateway.vercel.sh/v3/ai/config'
        }));
        expect(result).toEqual({
            models: ['anthropic/claude-sonnet-4.5', 'openai/gpt-5.4'],
            source: 'remote'
        });
    });

    test('discovers models from Anthropic providers via /models with Anthropic headers', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                data: [
                    { id: 'claude-sonnet-4-20250514' },
                    { id: 'claude-opus-4-20250514' }
                ]
            }
        } as any);

        const result = await discoverProviderModels({
            name: 'Anthropic',
            apiKey: 'anthropic-key',
            baseUrl: 'https://api.anthropic.com',
            model: 'claude-sonnet-4-20250514',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://api.anthropic.com/models?limit=1000',
            method: 'GET',
            headers: expect.objectContaining({
                'x-api-key': 'anthropic-key',
                'anthropic-version': '2023-06-01'
            })
        }));
        expect(result).toEqual({
            models: ['claude-opus-4-20250514', 'claude-sonnet-4-20250514'],
            source: 'remote'
        });
    });

    test('merges paginated Anthropic model discovery responses using after_id', async () => {
        mockedRequestUrl
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    data: [
                        { id: 'claude-sonnet-4-20250514' },
                        { id: 'claude-opus-4-20250514' }
                    ],
                    has_more: true,
                    last_id: 'claude-opus-4-20250514'
                }
            } as any)
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    data: [
                        { id: 'claude-opus-4-20250514' },
                        { id: 'claude-sonnet-4-5-20250929' }
                    ],
                    has_more: false,
                    last_id: 'claude-sonnet-4-5-20250929'
                }
            } as any);

        const result = await discoverProviderModels({
            name: 'Anthropic',
            apiKey: 'anthropic-key',
            baseUrl: 'https://api.anthropic.com',
            model: 'claude-sonnet-4-20250514',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenNthCalledWith(1, expect.objectContaining({
            url: 'https://api.anthropic.com/models?limit=1000',
            method: 'GET'
        }));
        expect(mockedRequestUrl).toHaveBeenNthCalledWith(2, expect.objectContaining({
            url: 'https://api.anthropic.com/models?limit=1000&after_id=claude-opus-4-20250514',
            method: 'GET'
        }));
        expect(result).toEqual({
            models: [
                'claude-opus-4-20250514',
                'claude-sonnet-4-20250514',
                'claude-sonnet-4-5-20250929'
            ],
            source: 'remote'
        });
    });

    test('normalizes Anthropic /models endpoints before fetching model list', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: { data: [{ id: 'claude-sonnet-4-20250514' }] }
        } as any);

        await discoverProviderModels({
            name: 'Anthropic',
            apiKey: 'anthropic-key',
            baseUrl: 'https://api.anthropic.com/models',
            model: 'claude-sonnet-4-20250514',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://api.anthropic.com/models?limit=1000'
        }));
    });

    test('normalizes Together chat/completions endpoints before fetching model list', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: [{ id: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo' }]
        } as any);

        await discoverProviderModels({
            name: 'Together',
            apiKey: 'together-key',
            baseUrl: 'https://api.together.xyz/v1/chat/completions',
            model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://api.together.xyz/v1/models'
        }));
    });

    test('discovers models from Ollama providers via /tags', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                models: [
                    { model: 'llama3.1:latest', name: 'llama3.1:latest' },
                    { name: 'qwen2.5:14b' }
                ]
            }
        } as any);

        const result = await discoverProviderModels({
            name: 'Ollama',
            apiKey: '',
            baseUrl: 'http://localhost:11434/api',
            model: 'llama3',
            temperature: 0.7
        });

        expect(mockedRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'http://localhost:11434/api/tags'
        }));
        expect(result.models).toEqual(['llama3.1:latest', 'qwen2.5:14b']);
    });

    test('normalizes Ollama /tags endpoints before fetching model tags', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: { models: [{ model: 'llama3.1:latest' }] }
        } as any);

        await discoverProviderModels({
            name: 'Ollama',
            apiKey: '',
            baseUrl: 'http://localhost:11434/api/tags',
            model: 'llama3',
            temperature: 0.7
        });

        expect(mockedRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'http://localhost:11434/api/tags'
        }));
    });

    test('discovers models from Google providers via v1 models list', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                models: [
                    { name: 'models/gemini-2.5-pro', supportedGenerationMethods: ['generateContent', 'countTokens'] },
                    { name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['streamGenerateContent'] }
                ]
            }
        } as any);

        const result = await discoverProviderModels({
            name: 'Google',
            apiKey: 'google-key',
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
            model: 'gemini-2.5-pro',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://generativelanguage.googleapis.com/v1beta/models?key=google-key'
        }));
        expect(result.models).toEqual(['gemini-2.5-flash', 'gemini-2.5-pro']);
    });

    test('merges paginated Google model discovery responses using nextPageToken', async () => {
        mockedRequestUrl
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    models: [
                        { name: 'models/gemini-2.5-pro', supportedGenerationMethods: ['generateContent'] },
                        { name: 'models/text-embedding-005', supportedGenerationMethods: ['embedContent'] }
                    ],
                    nextPageToken: 'page-2-token'
                }
            } as any)
            .mockResolvedValueOnce({
                status: 200,
                text: '',
                json: {
                    models: [
                        { name: 'models/gemini-2.5-pro', supportedGenerationMethods: ['generateContent'] },
                        { name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['streamGenerateContent'] }
                    ]
                }
            } as any);

        const result = await discoverProviderModels({
            name: 'Google',
            apiKey: 'google-key',
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
            model: 'gemini-2.5-pro',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenNthCalledWith(1, expect.objectContaining({
            url: 'https://generativelanguage.googleapis.com/v1beta/models?key=google-key'
        }));
        expect(mockedRequestUrl).toHaveBeenNthCalledWith(2, expect.objectContaining({
            url: 'https://generativelanguage.googleapis.com/v1beta/models?key=google-key&pageToken=page-2-token'
        }));
        expect(result).toEqual({
            models: ['gemini-2.5-flash', 'gemini-2.5-pro'],
            source: 'remote'
        });
    });

    test('filters non-generation Google model entries when supported generation methods are absent', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                models: [
                    { name: 'models/gemini-2.5-pro', supportedGenerationMethods: ['generateContent'] },
                    { name: 'models/text-embedding-005', supportedGenerationMethods: ['embedContent'] },
                    { name: 'models/imageclassification-efficientnet', supportedGenerationMethods: ['predict'] },
                    { name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['streamGenerateContent'] }
                ]
            }
        } as any);

        const result = await discoverProviderModels({
            name: 'Google',
            apiKey: 'google-key',
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
            model: 'gemini-2.5-pro',
            temperature: 0.5
        });

        expect(result.models).toEqual(['gemini-2.5-flash', 'gemini-2.5-pro']);
    });

    test('discovers Huawei Cloud MaaS models via the dedicated v2 registry endpoint', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: {
                data: [
                    { id: 'DeepSeek-V3' },
                    { model_name: 'Qwen3-235B-A22B' },
                    { model_id: 'DeepSeek-V3' }
                ]
            }
        } as any);

        const result = await discoverProviderModels({
            name: 'Huawei Cloud MaaS',
            apiKey: 'huaweicloud-key',
            baseUrl: 'https://api.modelarts-maas.com/openai/v1',
            model: 'DeepSeek-V3',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://api.modelarts-maas.com/v2/models',
            method: 'GET',
            headers: expect.objectContaining({
                Authorization: 'Bearer huaweicloud-key'
            })
        }));
        expect(result).toEqual({
            models: ['DeepSeek-V3', 'Qwen3-235B-A22B'],
            source: 'remote'
        });
    });

    test('normalizes Google /models endpoints before fetching model list', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 200,
            text: '',
            json: { models: [{ name: 'models/gemini-2.5-pro' }] }
        } as any);

        await discoverProviderModels({
            name: 'Google',
            apiKey: 'google-key',
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
            model: 'gemini-2.5-pro',
            temperature: 0.5
        });

        expect(mockedRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://generativelanguage.googleapis.com/v1beta/models?key=google-key'
        }));
    });

    test('fails with a clear error when required discovery prerequisites are missing', async () => {
        await expect(discoverProviderModels({
            name: 'Google',
            apiKey: '',
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
            model: 'gemini-2.5-pro',
            temperature: 0.5
        })).rejects.toThrow('Google model discovery requires an API key.');

        await expect(discoverProviderModels({
            name: 'OpenAI',
            apiKey: 'sk-test',
            baseUrl: '',
            model: 'gpt-4.1',
            temperature: 0.5
        })).rejects.toThrow('OpenAI model discovery requires a Base URL / endpoint.');

        await expect(discoverProviderModels({
            name: 'Anthropic',
            apiKey: '',
            baseUrl: 'https://api.anthropic.com',
            model: 'claude-sonnet-4-20250514',
            temperature: 0.5
        })).rejects.toThrow('Anthropic model discovery requires an API key.');
    });

    test('surfaces non-success model-discovery responses as actionable errors', async () => {
        mockedRequestUrl.mockResolvedValue({
            status: 401,
            text: 'Unauthorized',
            json: {}
        } as any);

        await expect(discoverProviderModels({
            name: 'OpenAI',
            apiKey: 'sk-test',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4.1',
            temperature: 0.5
        })).rejects.toThrow('Model discovery request failed: 401 Unauthorized');
    });

    test('returns an empty none-source result for unsupported providers', async () => {
        const result = await discoverProviderModels({
            name: 'Azure OpenAI',
            apiKey: 'azure-key',
            baseUrl: 'https://example.openai.azure.com',
            model: 'deployment-name',
            temperature: 0.5,
            apiVersion: '2025-01-01-preview'
        });

        expect(mockedRequestUrl).not.toHaveBeenCalled();
        expect(result).toEqual({
            models: [],
            source: 'none'
        });
    });

    test('does not pretend to support model discovery for manual-first providers that remain unsupported', async () => {
        const result = await discoverProviderModels({
            name: 'Azure OpenAI',
            apiKey: 'azure-key',
            baseUrl: 'https://example.openai.azure.com',
            model: 'deployment-name',
            temperature: 0.5
        });

        expect(mockedRequestUrl).not.toHaveBeenCalled();
        expect(result).toEqual({
            models: [],
            source: 'none'
        });
    });
});
