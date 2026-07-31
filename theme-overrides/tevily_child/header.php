<?php
/**
 * =============================================================
 *  UMOYA — CHILD THEME HEADER OVERRIDE  (theme header REMOVED)
 * =============================================================
 *  Upload to:  wp-content/themes/tevily_child/header.php
 *
 *  WHY THIS FILE EXISTS
 *  The Tevily parent theme renders its own site header on every page
 *  that uses the "Elementor Full Width" template (header.php dispatches
 *  to header-builder.php / header-default.php). That header contains a
 *  hardcoded mobile block (.header-mobile) driven by the WP "primary"
 *  menu, which no longer matches the site.
 *
 *  WordPress loads a child theme's header.php INSTEAD of the parent's,
 *  so this file removes the <header class="wp-site-header"> element
 *  entirely while reproducing everything else the parent opened.
 *
 *  ⚠ DO NOT REMOVE THE TWO WRAPPER DIVS BELOW
 *  .wrapper-page and #page-content are OPENED here and CLOSED by the
 *  parent theme's footer.php. Delete them and every page's layout
 *  breaks (footer.php would close tags that were never opened).
 *
 *  ⚠ THE NAV MUST MOVE
 *  The site nav was previously pasted INSIDE the theme header (via the
 *  theme's GVA layout builder). With the header gone, that slot no
 *  longer renders. Place shared/section-00-nav.html as the FIRST widget
 *  in the PAGE CONTENT instead — exactly as the Elementor Canvas pages
 *  (homepage, Founder's Circle) already do.
 *
 *  The theme FOOTER is untouched — footer.php still renders normally.
 *  To restore the original header, simply delete this file.
 * =============================================================
 */

$protocol = is_ssl() ? 'https' : 'http';
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?> class="no-js">
<head>
	<meta http-equiv="content-type" content="text/html; charset=<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="profile" href="<?php echo esc_attr( $protocol ); ?>://gmpg.org/xfn/11">
	<?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
	<?php wp_body_open(); ?>

	<div class="tevily-page-loading"></div>

	<div class="wrapper-page"> <!--page-->

		<?php
		/*
		 * These two hooks are preserved for plugin compatibility — they
		 * fired outside the <header> element in the parent theme, so
		 * anything hooked to them keeps working.
		 *
		 * Deliberately NOT fired: 'tevily_header_mobile'. That hook is
		 * what printed the stale mobile menu, and dropping it is the
		 * point of this override.
		 */
		do_action( 'tevily_before_header' );
		do_action( 'tevily_after_header' );
		?>

		<div id="page-content"> <!--page content-->
