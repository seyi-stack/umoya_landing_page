<?php
namespace Umoya_EW;

use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

final class Submissions {

    const POST_TYPE = 'umoya_submission';
    const REST_NAMESPACE = 'umoya/v1';
    const REST_ROUTE = '/submissions';

    private static $instance = null;

    public static function instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    private function __construct() {
        add_action( 'init', array( $this, 'register_post_type' ) );
        add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
        add_action( 'add_meta_boxes', array( $this, 'register_meta_boxes' ) );
        add_filter( 'manage_' . self::POST_TYPE . '_posts_columns', array( $this, 'submission_columns' ) );
        add_action( 'manage_' . self::POST_TYPE . '_posts_custom_column', array( $this, 'render_submission_column' ), 10, 2 );
        add_action( 'admin_post_umoya_resend_submission', array( $this, 'resend_submission' ) );
        add_action( 'admin_notices', array( $this, 'admin_notices' ) );
        add_action( 'wp_footer', array( $this, 'render_hubspot_tracking_code' ), 20 );
    }

    public function register_post_type() {
        register_post_type(
            self::POST_TYPE,
            array(
                'labels' => array(
                    'name'               => 'Umoya Submissions',
                    'singular_name'      => 'Umoya Submission',
                    'menu_name'          => 'Umoya Submissions',
                    'add_new_item'       => 'Add New Submission',
                    'edit_item'          => 'View Submission',
                    'new_item'           => 'New Submission',
                    'view_item'          => 'View Submission',
                    'search_items'       => 'Search Submissions',
                    'not_found'          => 'No submissions found',
                    'not_found_in_trash' => 'No submissions found in Trash',
                ),
                'public'              => false,
                'show_ui'             => true,
                'show_in_menu'        => true,
                'show_in_admin_bar'   => false,
                'exclude_from_search' => true,
                'menu_icon'           => 'dashicons-feedback',
                'supports'            => array( 'title' ),
                'capabilities'        => array(
                    'edit_post'          => 'manage_options',
                    'read_post'          => 'manage_options',
                    'delete_post'        => 'manage_options',
                    'edit_posts'         => 'manage_options',
                    'edit_others_posts'  => 'manage_options',
                    'publish_posts'      => 'manage_options',
                    'read_private_posts' => 'manage_options',
                    'create_posts'       => 'do_not_allow',
                ),
                'map_meta_cap'        => false,
            )
        );
    }

    public function register_rest_routes() {
        register_rest_route(
            self::REST_NAMESPACE,
            self::REST_ROUTE,
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array( $this, 'handle_submission' ),
                'permission_callback' => '__return_true',
            )
        );
    }

    public function handle_submission( WP_REST_Request $request ) {
        $payload = $request->get_json_params();
        if ( ! is_array( $payload ) ) {
            $payload = $request->get_params();
        }

        if ( $this->is_rate_limited() ) {
            return new WP_Error(
                'umoya_rate_limited',
                'Too many submissions. Please wait a few minutes and try again.',
                array( 'status' => 429 )
            );
        }

        $submission = $this->normalize_submission( $payload );
        $existing_id = $this->find_existing_submission( $submission['submission_uuid'] );

        if ( $existing_id ) {
            return rest_ensure_response(
                array(
                    'success'       => true,
                    'saved'         => true,
                    'submissionId'  => $existing_id,
                    'duplicate'     => true,
                    'hubspotStatus' => get_post_meta( $existing_id, '_umoya_hubspot_status', true ),
                )
            );
        }

        if ( empty( $submission['email'] ) || ! is_email( $submission['email'] ) ) {
            return new WP_Error(
                'umoya_invalid_email',
                'A valid email address is required.',
                array( 'status' => 400 )
            );
        }

        if ( empty( $submission['firstname'] ) || empty( $submission['lastname'] ) || empty( $submission['country'] ) ) {
            return new WP_Error(
                'umoya_missing_required_fields',
                'First name, last name, email, and country are required.',
                array( 'status' => 400 )
            );
        }

        $post_id = wp_insert_post(
            array(
                'post_type'   => self::POST_TYPE,
                'post_status' => 'private',
                'post_title'  => $this->build_submission_title( $submission ),
            ),
            true
        );

        if ( is_wp_error( $post_id ) ) {
            return new WP_Error(
                'umoya_save_failed',
                'WordPress could not save the submission.',
                array( 'status' => 500 )
            );
        }

        $this->save_submission_meta( $post_id, $submission, $payload );

        if ( ! empty( $payload['hubspotAlreadySent'] ) ) {
            $hubspot = array(
                'status'   => 'sent_direct_from_browser',
                'code'     => '',
                'response' => 'HubSpot was already sent directly from the browser after the WordPress endpoint was unavailable.',
            );
        } else {
            $hubspot = $this->send_to_hubspot( $submission, $payload );
        }
        update_post_meta( $post_id, '_umoya_hubspot_status', $hubspot['status'] );
        update_post_meta( $post_id, '_umoya_hubspot_code', $hubspot['code'] );
        update_post_meta( $post_id, '_umoya_hubspot_response', $hubspot['response'] );
        update_post_meta( $post_id, '_umoya_hubspot_last_attempt', current_time( 'mysql' ) );

        return rest_ensure_response(
            array(
                'success'       => true,
                'saved'         => true,
                'submissionId'  => $post_id,
                'hubspotStatus' => $hubspot['status'],
            )
        );
    }

    public function register_meta_boxes() {
        add_meta_box(
            'umoya_submission_details',
            'Submission Details',
            array( $this, 'render_submission_details' ),
            self::POST_TYPE,
            'normal',
            'high'
        );
    }

    public function render_submission_details( $post ) {
        $fields = array(
            'Submitted At'             => '_umoya_submitted_at',
            'Source'                   => '_umoya_source',
            'First Name'               => '_umoya_firstname',
            'Last Name'                => '_umoya_lastname',
            'Email'                    => '_umoya_email',
            'Phone'                    => '_umoya_phone',
            'Country'                  => '_umoya_country',
            'City'                     => '_umoya_city',
            'Preferred Travel Season'  => '_umoya_preferred_travel_season',
            'Preferred Travel Year'    => '_umoya_preferred_travel_year',
            'How would you like to Travel?' => '_umoya_preferred_journey_length',
            'Message'                  => '_umoya_founders_circle_message',
            'Page URL'                 => '_umoya_page_uri',
            'HubSpot Status'           => '_umoya_hubspot_status',
            'HubSpot Last Attempt'     => '_umoya_hubspot_last_attempt',
            'HubSpot Response Code'    => '_umoya_hubspot_code',
            'HubSpot Response'         => '_umoya_hubspot_response',
            'Submission ID'            => '_umoya_submission_uuid',
            'IP Address'               => '_umoya_ip_address',
            'User Agent'               => '_umoya_user_agent',
        );

        echo '<table class="widefat striped"><tbody>';
        foreach ( $fields as $label => $key ) {
            $value = get_post_meta( $post->ID, $key, true );
            if ( '' === $value ) {
                $value = '-';
            }

            echo '<tr>';
            echo '<th style="width:220px;">' . esc_html( $label ) . '</th>';
            if ( 'HubSpot Status' === $label ) {
                echo '<td>' . $this->status_badge( $value ) . '</td>';
            } elseif ( 'Email' === $label && '-' !== $value ) {
                echo '<td><a href="mailto:' . esc_attr( $value ) . '">' . esc_html( $value ) . '</a></td>';
            } elseif ( 'Page URL' === $label && '-' !== $value ) {
                echo '<td><a href="' . esc_url( $value ) . '" target="_blank" rel="noopener noreferrer">' . esc_html( $value ) . '</a></td>';
            } else {
                echo '<td>' . nl2br( esc_html( $value ) ) . '</td>';
            }
            echo '</tr>';
        }
        echo '</tbody></table>';

        $status = get_post_meta( $post->ID, '_umoya_hubspot_status', true );
        $url    = wp_nonce_url(
            admin_url( 'admin-post.php?action=umoya_resend_submission&submission_id=' . absint( $post->ID ) ),
            'umoya_resend_submission_' . absint( $post->ID )
        );

        echo '<p>';
        echo '<a class="button button-primary" href="' . esc_url( $url ) . '">Resend to HubSpot</a>';
        if ( $status ) {
            echo ' <span style="margin-left:8px;">Current HubSpot status: <strong>' . esc_html( $status ) . '</strong></span>';
        }
        echo '</p>';
    }

    public function submission_columns( $columns ) {
        $new_columns = array();
        if ( isset( $columns['cb'] ) ) {
            $new_columns['cb'] = $columns['cb'];
        }

        return array_merge(
            $new_columns,
            array(
                'title'         => 'Submission',
                'umoya_email'   => 'Email',
                'umoya_phone'   => 'Phone',
                'umoya_source'  => 'Source',
                'umoya_hubspot' => 'HubSpot',
                'date'          => 'Date',
            )
        );
    }

    public function render_submission_column( $column, $post_id ) {
        switch ( $column ) {
            case 'umoya_email':
                echo esc_html( get_post_meta( $post_id, '_umoya_email', true ) );
                break;
            case 'umoya_phone':
                echo esc_html( get_post_meta( $post_id, '_umoya_phone', true ) );
                break;
            case 'umoya_source':
                echo esc_html( get_post_meta( $post_id, '_umoya_source', true ) );
                break;
            case 'umoya_hubspot':
                $status = get_post_meta( $post_id, '_umoya_hubspot_status', true );
                echo $this->status_badge( $status ? $status : 'not attempted' );
                break;
        }
    }

    public function resend_submission() {
        $post_id = isset( $_GET['submission_id'] ) ? absint( $_GET['submission_id'] ) : 0;

        if ( ! $post_id || self::POST_TYPE !== get_post_type( $post_id ) || ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'You are not allowed to resend this submission.', 'umoya-elementor-widgets' ) );
        }

        check_admin_referer( 'umoya_resend_submission_' . $post_id );

        $submission = $this->get_submission_from_meta( $post_id );
        $payload    = array(
            'hubspotPortalId' => get_post_meta( $post_id, '_umoya_hubspot_portal_id', true ),
            'hubspotFormId'   => get_post_meta( $post_id, '_umoya_hubspot_form_id', true ),
            'consentText'     => get_post_meta( $post_id, '_umoya_consent_text', true ),
            'context'         => array(
                'pageUri'  => get_post_meta( $post_id, '_umoya_page_uri', true ),
                'pageName' => get_post_meta( $post_id, '_umoya_page_name', true ),
                'hutk'     => get_post_meta( $post_id, '_umoya_hutk', true ),
            ),
        );

        $hubspot = $this->send_to_hubspot( $submission, $payload );
        update_post_meta( $post_id, '_umoya_hubspot_status', $hubspot['status'] );
        update_post_meta( $post_id, '_umoya_hubspot_code', $hubspot['code'] );
        update_post_meta( $post_id, '_umoya_hubspot_response', $hubspot['response'] );
        update_post_meta( $post_id, '_umoya_hubspot_last_attempt', current_time( 'mysql' ) );

        wp_safe_redirect(
            add_query_arg(
                array(
                    'post'                 => $post_id,
                    'action'               => 'edit',
                    'umoya_resend_status'  => rawurlencode( $hubspot['status'] ),
                ),
                admin_url( 'post.php' )
            )
        );
        exit;
    }

    public function admin_notices() {
        if ( ! isset( $_GET['umoya_resend_status'] ) ) {
            return;
        }

        $status = sanitize_text_field( wp_unslash( $_GET['umoya_resend_status'] ) );
        $class  = 'sent' === $status ? 'notice notice-success' : 'notice notice-warning';

        echo '<div class="' . esc_attr( $class ) . '"><p>';
        echo esc_html( 'HubSpot resend status: ' . $status );
        echo '</p></div>';
    }

    public function render_hubspot_tracking_code() {
        if ( is_admin() ) {
            return;
        }
        ?>
        <script>
        (function(d,s,id){
          if(d.getElementById(id)) return;
          var js=d.createElement(s);
          js.id=id;
          js.async=true;
          js.defer=true;
          js.src='https://js.hs-scripts.com/246097317.js';
          var first=d.getElementsByTagName(s)[0];
          if(first && first.parentNode){ first.parentNode.insertBefore(js, first); }
          else { d.head.appendChild(js); }
        }(document,'script','hs-script-loader'));
        </script>
        <?php
    }

    private function normalize_submission( $payload ) {
        $field_values = array();

        if ( isset( $payload['fields'] ) && is_array( $payload['fields'] ) ) {
            foreach ( $payload['fields'] as $field ) {
                if ( ! is_array( $field ) || empty( $field['name'] ) ) {
                    continue;
                }

                $field_values[ sanitize_key( $field['name'] ) ] = $this->clean_value( isset( $field['value'] ) ? $field['value'] : '' );
            }
        }

        $raw_fields = array();
        if ( isset( $payload['rawFields'] ) && is_array( $payload['rawFields'] ) ) {
            foreach ( $payload['rawFields'] as $name => $value ) {
                $raw_fields[ sanitize_key( $name ) ] = $this->clean_value( $value );
            }
        }

        foreach ( $payload as $name => $value ) {
            if ( is_array( $value ) || in_array( $name, array( 'fields', 'rawFields', 'context', 'legalConsentOptions' ), true ) ) {
                continue;
            }

            $raw_fields[ sanitize_key( $name ) ] = $this->clean_value( $value );
        }

        $aliases = array(
            'salutation'                  => array( 'salutation', 'merge1', 'title' ),
            'firstname'                   => array( 'firstname', 'fname' ),
            'lastname'                    => array( 'lastname', 'lname' ),
            'email'                       => array( 'email' ),
            'phone'                       => array( 'phone' ),
            'country'                     => array( 'country', 'merge2' ),
            'city'                        => array( 'city', 'merge3' ),
            'preferred_travel_season'     => array( 'preferred_travel_season', 'merge4', 'season' ),
            'preferred_travel_year'       => array( 'preferred_travel_year', 'merge5', 'year' ),
            'preferred_journey_length'    => array( 'preferred_journey_length', 'merge6', 'length' ),
            'founders_circle_message'     => array( 'founders_circle_message', 'merge7', 'message' ),
        );

        $submission = array();
        foreach ( $aliases as $target => $keys ) {
            $submission[ $target ] = '';
            foreach ( $keys as $key ) {
                if ( ! empty( $field_values[ $key ] ) ) {
                    $submission[ $target ] = $field_values[ $key ];
                    break;
                }
                if ( ! empty( $raw_fields[ $key ] ) ) {
                    $submission[ $target ] = $raw_fields[ $key ];
                    break;
                }
            }
        }

        $context = isset( $payload['context'] ) && is_array( $payload['context'] ) ? $payload['context'] : array();
        $cookie_hutk = isset( $_COOKIE['hubspotutk'] ) ? $this->clean_value( $_COOKIE['hubspotutk'] ) : '';

        $submission['source']             = $this->clean_value( isset( $payload['source'] ) ? $payload['source'] : 'umoya_form' );
        $submission['page_uri']           = esc_url_raw( isset( $context['pageUri'] ) ? $context['pageUri'] : ( isset( $payload['pageUri'] ) ? $payload['pageUri'] : ( isset( $_SERVER['HTTP_REFERER'] ) ? wp_unslash( $_SERVER['HTTP_REFERER'] ) : '' ) ) );
        $submission['page_name']          = $this->clean_value( isset( $context['pageName'] ) ? $context['pageName'] : ( isset( $payload['pageName'] ) ? $payload['pageName'] : '' ) );
        $submission['hutk']               = $this->clean_value( isset( $context['hutk'] ) && $context['hutk'] ? $context['hutk'] : ( isset( $payload['hutk'] ) && $payload['hutk'] ? $payload['hutk'] : $cookie_hutk ) );
        $submission['hubspot_portal_id']  = $this->clean_value( isset( $payload['hubspotPortalId'] ) ? $payload['hubspotPortalId'] : '' );
        $submission['hubspot_form_id']    = $this->clean_value( isset( $payload['hubspotFormId'] ) ? $payload['hubspotFormId'] : '' );
        $submission['consent_text']       = $this->clean_value( isset( $payload['consentText'] ) ? $payload['consentText'] : '' );
        $submission['submission_uuid']    = $this->normalize_uuid( isset( $payload['submissionId'] ) ? $payload['submissionId'] : '' );
        $submission['submitted_at']       = current_time( 'mysql' );
        $submission['ip_address']         = $this->get_client_ip();
        $submission['user_agent']         = isset( $_SERVER['HTTP_USER_AGENT'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ) : '';

        return $submission;
    }

    private function save_submission_meta( $post_id, $submission, $payload ) {
        foreach ( $submission as $key => $value ) {
            update_post_meta( $post_id, '_umoya_' . $key, $value );
        }

        update_post_meta( $post_id, '_umoya_payload', wp_json_encode( $payload ) );
        update_post_meta( $post_id, '_umoya_hubspot_status', 'not attempted' );
    }

    private function send_to_hubspot( $submission, $payload ) {
        $portal_id = isset( $payload['hubspotPortalId'] ) ? $this->clean_value( $payload['hubspotPortalId'] ) : $submission['hubspot_portal_id'];
        $form_id   = isset( $payload['hubspotFormId'] ) ? $this->clean_value( $payload['hubspotFormId'] ) : $submission['hubspot_form_id'];

        if ( ! $portal_id || ! $form_id ) {
            return array(
                'status'   => 'skipped',
                'code'     => '',
                'response' => 'HubSpot Portal ID or Form ID is missing.',
            );
        }

        $hubspot_fields = array();
        foreach ( $this->hubspot_field_names() as $key ) {
            if ( ! empty( $submission[ $key ] ) ) {
                $hubspot_fields[] = array(
                    'name'  => $key,
                    'value' => $submission[ $key ],
                );
            }
        }

        $context = isset( $payload['context'] ) && is_array( $payload['context'] ) ? $payload['context'] : array();
        $body    = array(
            'fields'  => $hubspot_fields,
            'context' => array_filter(
                array(
                    'pageUri'  => isset( $context['pageUri'] ) ? esc_url_raw( $context['pageUri'] ) : $submission['page_uri'],
                    'pageName' => isset( $context['pageName'] ) ? $this->clean_value( $context['pageName'] ) : $submission['page_name'],
                    'hutk'     => isset( $context['hutk'] ) ? $this->clean_value( $context['hutk'] ) : $submission['hutk'],
                    'ipAddress'=> $submission['ip_address'],
                )
            ),
        );

        $consent_text = isset( $payload['consentText'] ) ? $this->clean_value( $payload['consentText'] ) : $submission['consent_text'];
        if ( $consent_text ) {
            $body['legalConsentOptions'] = array(
                'consent' => array(
                    'consentToProcess' => true,
                    'text'             => $consent_text,
                ),
            );
        }

        $response = wp_remote_post(
            'https://api.hsforms.com/submissions/v3/integration/submit/' . rawurlencode( $portal_id ) . '/' . rawurlencode( $form_id ),
            array(
                'timeout' => 15,
                'headers' => array(
                    'Content-Type' => 'application/json',
                ),
                'body'    => wp_json_encode( $body ),
            )
        );

        if ( is_wp_error( $response ) ) {
            return array(
                'status'   => 'failed',
                'code'     => '',
                'response' => $response->get_error_message(),
            );
        }

        $code          = wp_remote_retrieve_response_code( $response );
        $response_body = wp_remote_retrieve_body( $response );

        return array(
            'status'   => $code >= 200 && $code < 300 ? 'sent' : 'failed',
            'code'     => (string) $code,
            'response' => $response_body,
        );
    }

    private function hubspot_field_names() {
        return array(
            'salutation',
            'firstname',
            'lastname',
            'email',
            'phone',
            'country',
            'city',
            'preferred_travel_season',
            'preferred_travel_year',
            'preferred_journey_length',
            'founders_circle_message',
        );
    }

    private function get_submission_from_meta( $post_id ) {
        $submission = array();
        foreach ( array_merge( $this->hubspot_field_names(), array( 'hubspot_portal_id', 'hubspot_form_id', 'consent_text', 'page_uri', 'page_name', 'hutk' ) ) as $key ) {
            $submission[ $key ] = get_post_meta( $post_id, '_umoya_' . $key, true );
        }

        return $submission;
    }

    private function build_submission_title( $submission ) {
        $name = trim( $submission['firstname'] . ' ' . $submission['lastname'] );
        if ( ! $name ) {
            $name = $submission['email'];
        }

        return sprintf(
            '%s - %s',
            $name,
            current_time( 'Y-m-d H:i' )
        );
    }

    private function clean_value( $value ) {
        if ( is_array( $value ) ) {
            $value = implode( ', ', array_map( 'sanitize_text_field', wp_unslash( $value ) ) );
        }

        return sanitize_textarea_field( wp_unslash( (string) $value ) );
    }

    private function normalize_uuid( $value ) {
        $value = sanitize_text_field( wp_unslash( (string) $value ) );

        if ( ! $value ) {
            return wp_generate_uuid4();
        }

        return preg_match( '/^[a-zA-Z0-9_-]{8,80}$/', $value ) ? $value : wp_generate_uuid4();
    }

    private function find_existing_submission( $submission_uuid ) {
        if ( ! $submission_uuid ) {
            return 0;
        }

        $existing = get_posts(
            array(
                'post_type'      => self::POST_TYPE,
                'post_status'    => 'private',
                'fields'         => 'ids',
                'posts_per_page' => 1,
                'meta_key'       => '_umoya_submission_uuid',
                'meta_value'     => $submission_uuid,
            )
        );

        return $existing ? absint( $existing[0] ) : 0;
    }

    private function status_badge( $status ) {
        $status = $status ? $status : 'not attempted';
        $colors = array(
            'sent'                     => array( '#0f7b3f', '#e7f6ed' ),
            'sent_direct_from_browser' => array( '#2563eb', '#eff6ff' ),
            'failed'                   => array( '#b42318', '#fef3f2' ),
            'skipped'                  => array( '#92400e', '#fffbeb' ),
            'not attempted'            => array( '#475467', '#f2f4f7' ),
        );
        $color = isset( $colors[ $status ] ) ? $colors[ $status ] : $colors['not attempted'];

        return sprintf(
            '<span style="display:inline-flex;align-items:center;padding:3px 8px;border-radius:999px;font-size:12px;font-weight:600;color:%1$s;background:%2$s;">%3$s</span>',
            esc_attr( $color[0] ),
            esc_attr( $color[1] ),
            esc_html( str_replace( '_', ' ', $status ) )
        );
    }

    private function get_client_ip() {
        $headers = array( 'HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR' );

        foreach ( $headers as $header ) {
            if ( empty( $_SERVER[ $header ] ) ) {
                continue;
            }

            $value = sanitize_text_field( wp_unslash( $_SERVER[ $header ] ) );
            $parts = explode( ',', $value );
            $ip    = trim( $parts[0] );

            if ( filter_var( $ip, FILTER_VALIDATE_IP ) ) {
                return $ip;
            }
        }

        return '';
    }

    private function is_rate_limited() {
        $ip = $this->get_client_ip();
        if ( ! $ip ) {
            return false;
        }

        $key   = 'umoya_submission_rate_' . md5( $ip );
        $count = (int) get_transient( $key );

        if ( $count >= 8 ) {
            return true;
        }

        set_transient( $key, $count + 1, 10 * MINUTE_IN_SECONDS );
        return false;
    }
}
